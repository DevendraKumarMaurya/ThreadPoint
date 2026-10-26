-- ====================================================================
-- ThreadPoint Triggers & Stored Procedures
-- Enforces business rules at the database layer (NFR2):
-- 1. Reputation recalculation upon vote cast / update / delete / acceptance
-- 2. Single-accepted-answer constraint enforcement
-- 3. Polymorphic foreign key integrity validation for Vote & Comment
-- ====================================================================

-- Clean up any legacy or duplicate trigger functions
DROP TRIGGER IF EXISTS trg_single_accepted_answer ON "Answer";
DROP FUNCTION IF EXISTS trg_fn_single_accepted_answer() CASCADE;

DROP TRIGGER IF EXISTS trg_answer_acceptance_reputation_sync ON "Answer";
DROP FUNCTION IF EXISTS fn_answer_acceptance_reputation_sync() CASCADE;

DROP TRIGGER IF EXISTS trg_vote_reputation_sync ON "Vote";
DROP FUNCTION IF EXISTS trg_fn_reputation_on_vote() CASCADE;
DROP FUNCTION IF EXISTS trg_fn_vote_guard() CASCADE;

-- --------------------------------------------------------------------
-- 1. Polymorphic Vote Target Integrity Trigger
-- Ensures target_id points to a real Question or Answer
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_vote_target()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_type = 'question' THEN
        IF NOT EXISTS (SELECT 1 FROM "Question" WHERE id = NEW.target_id) THEN
            RAISE EXCEPTION 'Target question with id % does not exist', NEW.target_id;
        END IF;
    ELSIF NEW.target_type = 'answer' THEN
        IF NOT EXISTS (SELECT 1 FROM "Answer" WHERE id = NEW.target_id) THEN
            RAISE EXCEPTION 'Target answer with id % does not exist', NEW.target_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid target_type: %, must be question or answer', NEW.target_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_vote_target ON "Vote";
CREATE TRIGGER trg_check_vote_target
BEFORE INSERT OR UPDATE ON "Vote"
FOR EACH ROW
EXECUTE FUNCTION check_vote_target();

-- --------------------------------------------------------------------
-- 2. Single Accepted Answer Trigger
-- Guarantees that only ONE answer per question can be marked accepted
-- Belt-and-suspenders alongside partial unique index
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_single_accepted_answer()
RETURNS TRIGGER AS $$
DECLARE
    v_existing_accepted_id INT;
BEGIN
    IF NEW.is_accepted = TRUE THEN
        SELECT id INTO v_existing_accepted_id
        FROM "Answer"
        WHERE question_id = NEW.question_id
          AND is_accepted = TRUE
          AND id <> COALESCE(NEW.id, -1)
        LIMIT 1;

        IF v_existing_accepted_id IS NOT NULL THEN
            RAISE EXCEPTION 'Question % already has an accepted answer (Answer ID: %). Cannot accept multiple answers.',
                NEW.question_id, v_existing_accepted_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_single_accepted_answer ON "Answer";
CREATE TRIGGER trg_check_single_accepted_answer
BEFORE INSERT OR UPDATE OF is_accepted ON "Answer"
FOR EACH ROW
EXECUTE FUNCTION check_single_accepted_answer();

-- --------------------------------------------------------------------
-- 3. Authoritative Reputation Reconciliation Function
-- Rules:
-- - Question Upvote: +10 rep to question author
-- - Question Downvote: -2 rep to question author
-- - Answer Upvote: +10 rep to answer author
-- - Answer Downvote: -2 rep to answer author
-- - Accepted Answer: +15 rep to answer author, +2 rep to question author
-- Baseline minimum reputation: 1
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_user_reputation(p_user_id INT)
RETURNS INT AS $$
DECLARE
    v_rep INT;
    v_q_votes INT := 0;
    v_a_votes INT := 0;
    v_accepted_received INT := 0;
    v_accepted_given INT := 0;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN 1;
    END IF;

    -- Reputation from Question Votes received by user
    SELECT COALESCE(SUM(
        CASE
            WHEN v.value = 1 THEN 10
            WHEN v.value = -1 THEN -2
            ELSE 0
        END
    ), 0) INTO v_q_votes
    FROM "Vote" v
    JOIN "Question" q ON v.target_type = 'question' AND v.target_id = q.id
    WHERE q.user_id = p_user_id;

    -- Reputation from Answer Votes received by user
    SELECT COALESCE(SUM(
        CASE
            WHEN v.value = 1 THEN 10
            WHEN v.value = -1 THEN -2
            ELSE 0
        END
    ), 0) INTO v_a_votes
    FROM "Vote" v
    JOIN "Answer" a ON v.target_type = 'answer' AND v.target_id = a.id
    WHERE a.user_id = p_user_id;

    -- Reputation from Accepted Answers:
    -- +15 when user's answer is accepted
    SELECT COALESCE(COUNT(*) * 15, 0) INTO v_accepted_received
    FROM "Answer"
    WHERE user_id = p_user_id AND is_accepted = TRUE;

    -- +2 when user accepts an answer on their question
    SELECT COALESCE(COUNT(*) * 2, 0) INTO v_accepted_given
    FROM "Question" q
    JOIN "Answer" a ON a.question_id = q.id
    WHERE q.user_id = p_user_id AND a.is_accepted = TRUE;

    -- Total reputation (1 is baseline starting score)
    v_rep := GREATEST(1, 1 + v_q_votes + v_a_votes + v_accepted_received + v_accepted_given);

    UPDATE "User"
    SET reputation_score = v_rep,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;

    RETURN v_rep;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- 4. Vote Reputation Trigger
-- Automatically recalculates affected author's reputation on vote events
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_vote_reputation()
RETURNS TRIGGER AS $$
DECLARE
    v_old_author_id INT;
    v_new_author_id INT;
BEGIN
    -- Handle OLD row (DELETE or UPDATE)
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        IF OLD.target_type = 'question' THEN
            SELECT user_id INTO v_old_author_id FROM "Question" WHERE id = OLD.target_id;
        ELSIF OLD.target_type = 'answer' THEN
            SELECT user_id INTO v_old_author_id FROM "Answer" WHERE id = OLD.target_id;
        END IF;

        IF v_old_author_id IS NOT NULL THEN
            PERFORM recalculate_user_reputation(v_old_author_id);
        END IF;
    END IF;

    -- Handle NEW row (INSERT or UPDATE)
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.target_type = 'question' THEN
            SELECT user_id INTO v_new_author_id FROM "Question" WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'answer' THEN
            SELECT user_id INTO v_new_author_id FROM "Answer" WHERE id = NEW.target_id;
        END IF;

        IF v_new_author_id IS NOT NULL AND (TG_OP = 'INSERT' OR v_new_author_id <> COALESCE(v_old_author_id, -1)) THEN
            PERFORM recalculate_user_reputation(v_new_author_id);
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vote_reputation_sync ON "Vote";
CREATE TRIGGER trg_vote_reputation_sync
AFTER INSERT OR UPDATE OR DELETE ON "Vote"
FOR EACH ROW
EXECUTE FUNCTION trg_vote_reputation();

-- --------------------------------------------------------------------
-- 5. Answer Acceptance Reputation Trigger
-- Recalculates both the answer author's (+15) and question author's (+2) rep
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_answer_accepted_reputation()
RETURNS TRIGGER AS $$
DECLARE
    v_q_author_id INT;
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.is_accepted IS DISTINCT FROM NEW.is_accepted) OR
       (TG_OP = 'INSERT' AND NEW.is_accepted = TRUE) THEN
        
        -- Recalculate answer author
        IF NEW.user_id IS NOT NULL THEN
            PERFORM recalculate_user_reputation(NEW.user_id);
        END IF;

        -- Recalculate question author
        SELECT user_id INTO v_q_author_id FROM "Question" WHERE id = NEW.question_id;
        IF v_q_author_id IS NOT NULL THEN
            PERFORM recalculate_user_reputation(v_q_author_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_answer_accepted_reputation_sync ON "Answer";
CREATE TRIGGER trg_answer_accepted_reputation_sync
AFTER INSERT OR UPDATE OF is_accepted ON "Answer"
FOR EACH ROW
EXECUTE FUNCTION trg_answer_accepted_reputation();
