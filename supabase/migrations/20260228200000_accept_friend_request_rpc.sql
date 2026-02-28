DROP FUNCTION IF EXISTS accept_friend_request(uuid);
CREATE FUNCTION accept_friend_request(p_sender_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_receiver_id uuid := auth.uid();
  v_user1 uuid;
  v_user2 uuid;
BEGIN
  -- Update the request status
  UPDATE friend_requests
  SET status = 'accepted'
  WHERE sender_id = p_sender_id
    AND receiver_id = v_receiver_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending friend request found';
  END IF;

  -- Sort IDs for consistent storage
  IF p_sender_id < v_receiver_id THEN
    v_user1 := p_sender_id;
    v_user2 := v_receiver_id;
  ELSE
    v_user1 := v_receiver_id;
    v_user2 := p_sender_id;
  END IF;

  -- Create the friendship
  INSERT INTO friends (user1_id, user2_id)
  VALUES (v_user1, v_user2);
END;
$$;

DROP FUNCTION IF EXISTS delete_friend(uuid);
CREATE FUNCTION delete_friend(p_friend_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_other_id uuid;
  v_row friends%ROWTYPE;
BEGIN
  -- Fetch and verify ownership
  SELECT * INTO v_row
  FROM friends
  WHERE id = p_friend_id
    AND (user1_id = v_user_id OR user2_id = v_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friendship not found';
  END IF;

  -- Determine the other user
  IF v_row.user1_id = v_user_id THEN
    v_other_id := v_row.user2_id;
  ELSE
    v_other_id := v_row.user1_id;
  END IF;

  -- Delete the friendship
  DELETE FROM friends WHERE id = p_friend_id;

  -- Cleanup accepted friend requests in both directions
  DELETE FROM friend_requests
  WHERE status = 'accepted'
    AND (
      (sender_id = v_user_id AND receiver_id = v_other_id)
      OR (sender_id = v_other_id AND receiver_id = v_user_id)
    );
END;
$$;
