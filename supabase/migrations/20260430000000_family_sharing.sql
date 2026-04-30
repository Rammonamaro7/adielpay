-- Create Family Sharing table
CREATE TABLE account_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(owner_id, guest_id)
);

ALTER TABLE account_shares ENABLE ROW LEVEL SECURITY;

-- Both owner and guest can view the share
CREATE POLICY "Users can view their own shares" ON account_shares 
FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = guest_id);

-- Only owner can create a share
CREATE POLICY "Users can insert shares" ON account_shares 
FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owner or guest can delete the share
CREATE POLICY "Users can delete shares" ON account_shares 
FOR DELETE USING (auth.uid() = owner_id OR auth.uid() = guest_id);

-- Update Transactions policies to allow shared access
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own and shared transactions" ON transactions 
FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    user_id IN (SELECT owner_id FROM account_shares WHERE guest_id = auth.uid())
    OR
    user_id IN (SELECT guest_id FROM account_shares WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update own and shared transactions" ON transactions 
FOR UPDATE USING (
    auth.uid() = user_id 
    OR 
    user_id IN (SELECT owner_id FROM account_shares WHERE guest_id = auth.uid())
    OR
    user_id IN (SELECT guest_id FROM account_shares WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete own and shared transactions" ON transactions 
FOR DELETE USING (
    auth.uid() = user_id 
    OR 
    user_id IN (SELECT owner_id FROM account_shares WHERE guest_id = auth.uid())
    OR
    user_id IN (SELECT guest_id FROM account_shares WHERE owner_id = auth.uid())
);

-- Note: INSERT policy still forces auth.uid() = user_id to ensure ownership of created records.
-- If they want to insert a transaction that shows up for the other, they can just use their own user_id, 
-- and the SELECT policy will allow the other to see it since they are linked!

-- Repeat for Budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
CREATE POLICY "Users can view their own and shared budgets" ON budgets 
FOR SELECT USING (
    auth.uid() = user_id 
    OR user_id IN (SELECT owner_id FROM account_shares WHERE guest_id = auth.uid())
    OR user_id IN (SELECT guest_id FROM account_shares WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
CREATE POLICY "Users can update own and shared budgets" ON budgets 
FOR UPDATE USING (
    auth.uid() = user_id 
    OR user_id IN (SELECT owner_id FROM account_shares WHERE guest_id = auth.uid())
    OR user_id IN (SELECT guest_id FROM account_shares WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
CREATE POLICY "Users can delete own and shared budgets" ON budgets 
FOR DELETE USING (
    auth.uid() = user_id 
    OR user_id IN (SELECT owner_id FROM account_shares WHERE guest_id = auth.uid())
    OR user_id IN (SELECT guest_id FROM account_shares WHERE owner_id = auth.uid())
);
