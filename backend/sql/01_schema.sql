-- ThreadPoint Database Schema (PostgreSQL 3NF Normalized)

-- 1. User table
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    reputation_score INT DEFAULT 1 NOT NULL,
    is_google_auth BOOLEAN DEFAULT FALSE NOT NULL,
    auth_provider VARCHAR(20) DEFAULT 'local' NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ensure avatar_url, bio, Google Auth, and Email Verification columns exist if table was previously created
ALTER TABLE "User" ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS is_google_auth BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local' NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS website_url TEXT;

CREATE INDEX IF NOT EXISTS idx_user_google_id ON "User"(google_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- 1b. EmailOtp table for OTP Verification & Password Reset
CREATE TABLE IF NOT EXISTS "EmailOtp" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'email_verification' NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_otp_lookup ON "EmailOtp"(email, purpose);

-- 2. Question table with tsvector search_vector
CREATE TABLE IF NOT EXISTS "Question" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    views INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ensure views and user_id columns exist
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;

-- Add generated tsvector column for Full-Text Search (title weighted A, body weighted B)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Question' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE "Question" ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(body, '')), 'B')
        ) STORED;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS question_search_idx ON "Question" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_question_user ON "Question"(user_id);
CREATE INDEX IF NOT EXISTS idx_question_created_at ON "Question"(created_at DESC);

-- 3. Answer table
CREATE TABLE IF NOT EXISTS "Answer" (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_answer_question ON "Answer"(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_user ON "Answer"(user_id);

-- Belt-and-suspenders partial unique index: Exactly one accepted answer per question
CREATE UNIQUE INDEX IF NOT EXISTS one_accepted_per_question 
ON "Answer" (question_id) WHERE is_accepted = TRUE;

-- 4. Tag table
CREATE TABLE IF NOT EXISTS "Tag" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. QuestionTag join table (3NF many-to-many)
CREATE TABLE IF NOT EXISTS "QuestionTag" (
    question_id INT NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES "Tag"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (question_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_questiontag_tag ON "QuestionTag"(tag_id);

-- 6. Vote table (Polymorphic: 'question' or 'answer')
CREATE TABLE IF NOT EXISTS "Vote" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('question', 'answer')),
    target_id INT NOT NULL,
    value INT NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_vote_target UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_target ON "Vote"(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_vote_user ON "Vote"(user_id);

-- 7. Comment table (Polymorphic with hierarchical self-referencing tree)
CREATE TABLE IF NOT EXISTS "Comment" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('question', 'answer')),
    target_id INT NOT NULL,
    body TEXT NOT NULL,
    parent_comment_id INT REFERENCES "Comment"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_target ON "Comment"(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comment_parent ON "Comment"(parent_comment_id);

-- 8. Gamification / Badges (Stretch)
CREATE TABLE IF NOT EXISTS "Badge" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('gold', 'silver', 'bronze')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "UserBadge" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    badge_id INT NOT NULL REFERENCES "Badge"(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- 9. Bookmarks / Saved Questions
CREATE TABLE IF NOT EXISTS "Bookmark" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_question_bookmark UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmark_user ON "Bookmark"(user_id);

-- 10. UserFollow table (Followers & Following)
CREATE TABLE IF NOT EXISTS "UserFollow" (
    id SERIAL PRIMARY KEY,
    follower_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    following_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follow_follower ON "UserFollow"(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_following ON "UserFollow"(following_id);

-- 11. Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    id SERIAL PRIMARY KEY,
    recipient_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    actor_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    target_type VARCHAR(20),
    target_id INT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_recipient ON "Notification"(recipient_id, is_read, created_at DESC);

-- 12. UserTagFollow table (Watched tags)
CREATE TABLE IF NOT EXISTS "UserTagFollow" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES "Tag"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_tag_follow UNIQUE (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tag_follow ON "UserTagFollow"(user_id);

-- 13. Content Reports & Moderation
CREATE TABLE IF NOT EXISTS "Report" (
    id SERIAL PRIMARY KEY,
    reporter_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_target ON "Report"(target_type, target_id);

-- 14. Seed Default Badges
INSERT INTO "Badge" (name, description, icon, tier)
VALUES 
    ('First Question', 'Asked their first question on ThreadPoint', 'HelpCircle', 'bronze'),
    ('First Answer', 'Contributed an answer to help another developer', 'MessageSquare', 'bronze'),
    ('Problem Solver', 'Had an answer accepted as the verified solution', 'CheckCircle2', 'silver'),
    ('Popular Question', 'Authored a question that received 5 or more upvotes', 'Flame', 'bronze'),
    ('Good Answer', 'Authored an answer that received 10 or more upvotes', 'Award', 'silver'),
    ('Community Scholar', 'Attained a reputation score of 100 or higher', 'Sparkles', 'gold'),
    ('Conversation Starter', 'Attracted 5 or more developer followers', 'Users', 'bronze'),
    ('Master Contributor', 'Authored 5 or more accepted answers', 'ShieldCheck', 'gold')
ON CONFLICT (name) DO NOTHING;

