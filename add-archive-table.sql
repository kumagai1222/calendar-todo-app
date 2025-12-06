-- Create archive table for completed todos
CREATE TABLE IF NOT EXISTS archived_todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Original todo data
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deadline TIMESTAMP WITH TIME ZONE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Archive metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Original todo ID for reference
  original_todo_id UUID,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_archived_todos_user_id ON archived_todos(user_id);

-- Create index for archived_at
CREATE INDEX IF NOT EXISTS idx_archived_todos_archived_at ON archived_todos(archived_at);

-- Enable Row Level Security
ALTER TABLE archived_todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "archived_todos_select_policy" ON archived_todos;
DROP POLICY IF EXISTS "archived_todos_insert_policy" ON archived_todos;
DROP POLICY IF EXISTS "archived_todos_delete_policy" ON archived_todos;

-- Create policies
CREATE POLICY "archived_todos_select_policy"
ON archived_todos FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "archived_todos_insert_policy"
ON archived_todos FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "archived_todos_delete_policy"
ON archived_todos FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE archived_todos IS '完了したTodoのアーカイブ';
COMMENT ON COLUMN archived_todos.completed_at IS 'Todoが完了した日時';
COMMENT ON COLUMN archived_todos.archived_at IS 'アーカイブに移動した日時';
COMMENT ON COLUMN archived_todos.original_todo_id IS '元のTodoのID(参照用)';
