-- ============================================================
-- Fix: Allow question authors to accept answers on their questions
-- The existing "Authors can update own answers" policy only lets
-- the answer author edit their own answer content. Question authors
-- need a separate policy to set is_accepted = true.
-- ============================================================

create policy "Question authors can accept answers"
  on public.answers for update
  using (
    exists (
      select 1 from public.questions
      where questions.id = answers.question_id
        and questions.user_id = auth.uid()
    )
  );
