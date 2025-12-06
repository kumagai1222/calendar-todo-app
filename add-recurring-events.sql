-- Add recurring event columns to calendar_events table

-- Add columns for recurring events
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE;

-- Create index for recurring events
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurring ON calendar_events(is_recurring);
CREATE INDEX IF NOT EXISTS idx_calendar_events_parent ON calendar_events(parent_event_id);

-- Add comment
COMMENT ON COLUMN calendar_events.is_recurring IS '繰り返し予定かどうか';
COMMENT ON COLUMN calendar_events.recurrence_type IS '繰り返しのタイプ: daily, weekly, monthly, yearly';
COMMENT ON COLUMN calendar_events.recurrence_end_date IS '繰り返しの終了日';
COMMENT ON COLUMN calendar_events.recurrence_interval IS '繰り返しの間隔（例：2なら2日ごと、2週間ごと）';
COMMENT ON COLUMN calendar_events.parent_event_id IS '親予定のID（繰り返しから生成された予定の場合）';
