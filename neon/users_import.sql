--
-- Import the 4 existing Supabase auth users into the new "users" table.
-- Original IDs and bcrypt password hashes are preserved, so these people
-- can log in with their existing passwords without any reset needed.
--

INSERT INTO public.users (id, email, password_hash, name, role, created_at)
VALUES
  ('fa143c04-574b-40bb-8692-dfe8dd5f1be8', 'jmnanjau@gmail.com', '$2a$10$QM5OxkeVzPtRMXcxLQv4I.QrM2pRMNA1O9R/e1d.cGJQk2gL4WRF6', 'Jefferson Mwiti', 'family_admin', '2026-09-11 13:12:24.054286+00'),
  ('5a42b93e-393c-4f83-b0cb-2731e36f58d2', 'gitarimukami15@gmail.com', '$2a$10$kk7kZo1iODTTs127sioPsuQvemkLgQv1d/tq2bDznLqXFU637jiNW', 'Kathomi Gitari', 'super_admin', '2026-09-09 18:11:27.152776+00'),
  ('9a9c533d-ccb3-4053-9b00-337cab55ced7', 'mamamwesh03@gmail.com', '$2a$10$6pzjTFmxzCLnOiA62dGqSOzDi3nFqz697T0IV5iUWticrbNgyYTo.', 'Mercy Mwongera', 'family_admin', '2026-09-10 10:32:55.363825+00'),
  ('a39abcb6-eccc-49fa-9235-d38eefddbbaa', 'gitari1martin@gmail.com', '$2a$10$pa39j5gfHRSajZOT61hNwuVezRg0DXsx3MFvgEHjd.kLMXtet/yeG', 'Martin Gitari', 'family_admin', '2026-09-10 14:08:48.003324+00')
ON CONFLICT (email) DO NOTHING;
