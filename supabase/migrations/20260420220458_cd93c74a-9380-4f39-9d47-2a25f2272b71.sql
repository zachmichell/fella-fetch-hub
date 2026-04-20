-- Enum for sender type
CREATE TYPE public.message_sender_type AS ENUM ('staff', 'owner');

-- conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  last_message_at timestamptz,
  last_message_preview text,
  unread_staff integer NOT NULL DEFAULT 0,
  unread_owner integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX conversations_org_owner_unique
  ON public.conversations(organization_id, owner_id);
CREATE INDEX conversations_org_idx ON public.conversations(organization_id);
CREATE INDEX conversations_owner_idx ON public.conversations(owner_id);
CREATE INDEX conversations_last_message_idx
  ON public.conversations(last_message_at DESC NULLS LAST);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Staff: full access via org membership
CREATE POLICY "Staff tenant select" ON public.conversations
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Staff tenant insert" ON public.conversations
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Staff tenant update" ON public.conversations
  FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Staff tenant delete" ON public.conversations
  FOR DELETE USING (public.is_org_member(organization_id));

-- Owners: access their own conversation
CREATE POLICY "Owner read own conversation" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.owners o
      WHERE o.id = conversations.owner_id
        AND o.profile_id = auth.uid()
    )
  );
CREATE POLICY "Owner insert own conversation" ON public.conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.owners o
      WHERE o.id = owner_id
        AND o.profile_id = auth.uid()
    )
  );
CREATE POLICY "Owner update own conversation" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.owners o
      WHERE o.id = conversations.owner_id
        AND o.profile_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type public.message_sender_type NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conv_created_idx
  ON public.messages(conversation_id, created_at);
CREATE INDEX messages_conv_read_idx
  ON public.messages(conversation_id, read_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Staff: access messages in conversations from their org
CREATE POLICY "Staff select messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.is_org_member(c.organization_id)
    )
  );
CREATE POLICY "Staff insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_type = 'staff'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND public.is_org_member(c.organization_id)
    )
  );
CREATE POLICY "Staff update messages" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.is_org_member(c.organization_id)
    )
  );

-- Owners: access messages in their own conversation
CREATE POLICY "Owner select messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.owners o ON o.id = c.owner_id
      WHERE c.id = messages.conversation_id
        AND o.profile_id = auth.uid()
    )
  );
CREATE POLICY "Owner insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_type = 'owner'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.owners o ON o.id = c.owner_id
      WHERE c.id = conversation_id
        AND o.profile_id = auth.uid()
        AND o.id = messages.sender_id
    )
  );
CREATE POLICY "Owner update messages" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.owners o ON o.id = c.owner_id
      WHERE c.id = messages.conversation_id
        AND o.profile_id = auth.uid()
    )
  );

-- Trigger: on new message, update conversation preview + counters
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.body, 80),
    unread_staff = CASE WHEN NEW.sender_type = 'owner' THEN unread_staff + 1 ELSE unread_staff END,
    unread_owner = CASE WHEN NEW.sender_type = 'staff' THEN unread_owner + 1 ELSE unread_owner END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_after_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;