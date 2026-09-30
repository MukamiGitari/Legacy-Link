-- Migration 022: Deduplicate relationships in Neon Postgres
-- Removes any duplicate relationship rows between the same members for the same relationship type,
-- preserving the primary row and ensuring clean 1:1 records per direction.

DELETE FROM relationships a
USING relationships b
WHERE a.id > b.id
  AND a.family_id = b.family_id
  AND a.from_member_id = b.from_member_id
  AND a.to_member_id = b.to_member_id
  AND a.relationship_type = b.relationship_type;
