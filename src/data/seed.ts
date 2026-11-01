import type {
  FamilyDataset, Member, Relationship, Album, Photo, Memory,
  FamilyEvent, Announcement, ChronicleEra, Profile, Biography, LegacyContribution,
  LanguageEntry, TriviaScore, CookbookAlbum, Recipe,
} from '../types';

const FAMILY_ID = 'family-kobia-kiogora';

const AVATAR = (seed: string) =>
  `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}`;

const m = (partial: Omit<Member, 'familyId' | 'isLiving'> & { isLiving?: boolean }): Member => ({
  familyId: FAMILY_ID,
  isLiving: partial.dateOfPassing ? false : true,
  avatarUrl: AVATAR(partial.id),
  ...partial,
});

export const members: Member[] = [
  // Generation -2 — Foundation Ancestor of the M'Ikunyua Lineage
  m({ id: 'b0000000-0000-0000-0000-000000000005', firstName: 'Kurirua', lastName: 'Ancestor', gender: 'male', generation: -2,
    occupation: 'Founding Ancestor',
    bio: 'Founding apex ancestor and foundation of the M\'Ikunyua lineage. Great-grandfather of Senior Chief Gerald Kithinji M\'Ikunyua and father of M\'Mbwiria.',
    isFounder: true, birthPlace: 'Meru, Kenya', location: 'Meru, Kenya' }),

  // Generation -1 — Lineage Patriarch
  m({ id: 'b0000000-0000-0000-0000-000000000004', firstName: "M'Mbwiria", lastName: 'son of Kurirua', gender: 'male', generation: -1,
    occupation: 'Lineage Patriarch',
    bio: 'Father of Nkuruu M\'Mbwiria and grandfather of Senior Chief Gerald Kithinji M\'Ikunyua. Son of Kurirua.',
    isFounder: false, birthPlace: 'Meru, Kenya', location: 'Meru, Kenya' }),

  // Generation 0 — Founding Patriarch & Wives
  m({ id: 'b0000000-0000-0000-0000-000000000001', firstName: 'Nkuruu', lastName: "M'Mbwiria", gender: 'male', generation: 0,
    occupation: 'Farmer & WWI Veteran',
    bio: 'Father of Senior Chief Gerald M\'Ikunyua and founding patriarch of the Mbwiria lineage (son of M\'Mbwiria, son of Kurirua). A World War I veteran deployed to Dodoma, Tanzania, who farmed bananas, yams, and coffee in Kinoru and kept cattle and sheep.',
    isFounder: false, birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0000-000000000002', firstName: 'Salome Gateti', lastName: 'CioMuga', gender: 'female', generation: 0,
    occupation: 'Homesteader & Farmer',
    bio: 'Mother of Senior Chief Gerald M\'Ikunyua and first wife of Nkuruu M\'Mbwiria. Raised three sons in Kinoru, planted millet and ncabi (black beans) in Kithoka, and saved young Gerald from a childhood fire.',
    isFounder: false, birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0000-000000000003', firstName: 'Second Wife', lastName: "M'Mbwiria", gender: 'female', generation: 0,
    occupation: 'Homesteader & Farmer',
    bio: 'Second wife of Nkuruu M\'Mbwiria who raised three sons in Kinoru alongside Salome Gateti.',
    isFounder: false, birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),

  // Generation 1 — Brothers of Gerald (House of Salome Gateti - First Wife)
  m({ id: 'b0000000-0000-0000-0001-000000000011', firstName: 'Geoffrey', lastName: 'Baichu', gender: 'male', generation: 1,
    bio: 'First son of Salome Gateti and Nkuruu M\'Mbwiria; elder brother of Senior Chief Gerald Kithinji M\'Ikunyua.',
    birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0001-000000000012', firstName: 'Silas', lastName: 'Ruteere', gender: 'male', generation: 1,
    bio: 'Second son of Salome Gateti and Nkuruu M\'Mbwiria; elder brother of Senior Chief Gerald Kithinji M\'Ikunyua.',
    birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),

  // Generation 1 — Stepbrothers of Gerald (House of Second Wife)
  m({ id: 'b0000000-0000-0000-0001-000000000021', firstName: "M'Mwongo", lastName: 'Nkuruu', gender: 'male', generation: 1,
    bio: 'Son of the second wife of Nkuruu M\'Mbwiria; brother of Senior Chief Gerald Kithinji M\'Ikunyua.',
    birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0001-000000000022', firstName: 'John', lastName: "M'Riria", gender: 'male', generation: 1,
    bio: 'Son of the second wife of Nkuruu M\'Mbwiria; brother of Senior Chief Gerald Kithinji M\'Ikunyua.',
    birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0001-000000000023', firstName: 'Festus Ruguku', lastName: '(Mwalili)', gender: 'male', generation: 1,
    bio: 'Son of the second wife of Nkuruu M\'Mbwiria; brother of Senior Chief Gerald Kithinji M\'Ikunyua.',
    birthPlace: 'Kinoru, Meru, Kenya', location: 'Kinoru, Meru, Kenya' }),

  // Generation 1 — M'Ikunyua Patriarch & Matriarch
  m({ id: 'b0000000-0000-0000-0001-000000000001', firstName: 'Gerald Kithinji', lastName: "M'Ikunyua", gender: 'male', generation: 1,
    dateOfBirth: '1937-08-14', birthPlace: 'Kinoru Village, Meru, Kenya', occupation: 'Senior Chief, Animal Production Officer & Agricultural Pioneer',
    bio: 'Patriarch of the M\'Ikunyua family, pioneering agriculturalist, Senior Chief of Ntima location, and lifelong public servant who transformed dairy farming, cooperatives, and community development across Meru and Kenya.',
    isFounder: false, professionalTitle: 'Senior Chief / Assistant Animal Production Officer', currentOrganization: 'Ministry of Agriculture & Livestock / Office of the President', location: 'Kinoru, Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0001-000000000002', firstName: 'Lily', lastName: 'Ncurubi', gender: 'female', generation: 1,
    birthPlace: 'Meru, Kenya', occupation: 'Matriarch & Community Leader',
    bio: 'Beloved matriarch of the M\'Ikunyua family, who supported community development, local agriculture, and raised six children who carry forward the family legacy.',
    isFounder: false, location: 'Kinoru, Meru, Kenya' }),

  // Generation 2 — Children of Gerald & Lily
  m({ id: 'b0000000-0000-0000-0002-000000000001', firstName: 'Thomas', lastName: 'Muriithi', gender: 'male', generation: 2, birthPlace: 'Kinoru, Meru, Kenya', location: 'Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0002-000000000002', firstName: 'Timothy', lastName: 'Mwirigi', gender: 'male', generation: 2, birthPlace: 'Kinoru, Meru, Kenya', location: 'Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0002-000000000003', firstName: 'Jane', lastName: 'Kathure', gender: 'female', generation: 2, birthPlace: 'Kinoru, Meru, Kenya', location: 'Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0002-000000000004', firstName: 'Martin', lastName: 'Gitari', gender: 'male', generation: 2, birthPlace: 'Kinoru, Meru, Kenya', location: 'Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0002-000000000005', firstName: 'Betty', lastName: 'Karwitha', gender: 'female', generation: 2, birthPlace: 'Kinoru, Meru, Kenya', location: 'Meru, Kenya' }),
  m({ id: 'b0000000-0000-0000-0002-000000000006', firstName: 'Edwin', lastName: 'Kimathi', gender: 'male', generation: 2, birthPlace: 'Kinoru, Meru, Kenya', location: 'Meru, Kenya' }),

  // Generation 1 — the root couple
  m({ id: 'm1', firstName: 'Reuben', lastName: 'Kobia', gender: 'male', generation: 1,
    dateOfBirth: '1928-03-14', dateOfPassing: '2005-11-02', birthPlace: 'Nkubu, Kenya',
    restingPlace: 'Nkubu Family Land', occupation: 'Coffee Farmer',
    bio: 'Reuben founded the family homestead near Nkubu in 1951 and planted the first coffee terraces, on the eastern slopes of Mount Kenya, that still bear fruit today.' }),
  m({ id: 'm2', firstName: 'Naomi', lastName: 'Kobia', maidenName: 'Kiogora', gender: 'female', generation: 1,
    dateOfBirth: '1932-07-22', dateOfPassing: '2010-01-19', birthPlace: 'Chogoria, Kenya',
    restingPlace: 'Nkubu Family Land', occupation: 'Teacher',
    bio: 'Naomi taught three generations of children at Chogoria Primary and kept the family\'s oral history alive through song.' }),

  // Generation 2 — children of Reuben & Naomi, plus their spouses (married in)
  m({ id: 'm3', firstName: 'Peter', lastName: 'Kobia', gender: 'male', generation: 2,
    dateOfBirth: '1952-05-01', birthPlace: 'Nkubu, Kenya', occupation: 'Retired Civil Engineer' }),
  m({ id: 'm4', firstName: 'Alice', lastName: 'Kobia', maidenName: 'Kaimenyi', gender: 'female', generation: 2,
    dateOfBirth: '1955-09-10', birthPlace: 'Maua, Kenya', occupation: 'Retired Nurse' }),
  m({ id: 'm5', firstName: 'Susan', lastName: 'Kaari', gender: 'female', generation: 2,
    dateOfBirth: '1955-02-18', birthPlace: 'Nkubu, Kenya', occupation: 'Retired Bank Manager' }),
  m({ id: 'm6', firstName: 'David', lastName: 'Muthomi', gender: 'male', generation: 2,
    dateOfBirth: '1950-12-03', birthPlace: 'Timau, Kenya', occupation: 'Retired Pastor' }),
  m({ id: 'm7', firstName: 'James', lastName: 'Kobia', gender: 'male', generation: 2,
    dateOfBirth: '1958-08-27', birthPlace: 'Nkubu, Kenya', occupation: 'Miraa Trader' }),
  m({ id: 'm8', firstName: 'Ruth', lastName: 'Kobia', maidenName: 'Achieng', gender: 'female', generation: 2,
    dateOfBirth: '1960-04-11', birthPlace: 'Kisumu, Kenya', occupation: 'Retired Accountant' }),

  // Generation 3 — grandchildren
  m({ id: 'm9', firstName: 'John', lastName: 'Kobia', gender: 'male', generation: 3,
    dateOfBirth: '1978-06-15', birthPlace: 'Nairobi, Kenya', occupation: 'Software Architect' }),
  m({ id: 'm10', firstName: 'Mary', lastName: 'Kobia', maidenName: 'Otieno', gender: 'female', generation: 3,
    dateOfBirth: '1980-03-30', birthPlace: 'Kisumu, Kenya', occupation: 'Pediatrician' }),
  m({ id: 'm11', firstName: 'Catherine', lastName: 'Kobia', gender: 'female', generation: 3,
    dateOfBirth: '1982-10-05', birthPlace: 'Nairobi, Kenya', occupation: 'Architect' }),
  m({ id: 'm12', firstName: 'Samuel', lastName: 'Odhiambo', gender: 'male', generation: 3,
    dateOfBirth: '1980-01-20', birthPlace: 'Kisumu, Kenya', occupation: 'Marine Engineer' }),
  m({ id: 'm13', firstName: 'Daniel', lastName: 'Muthomi', gender: 'male', generation: 3,
    dateOfBirth: '1980-07-08', birthPlace: 'Nkubu, Kenya', occupation: 'Agronomist' }),
  m({ id: 'm14', firstName: 'Faith', lastName: 'Muthomi', gender: 'female', generation: 3,
    dateOfBirth: '1983-11-25', birthPlace: 'Nkubu, Kenya', occupation: 'Journalist' }),
  m({ id: 'm15', firstName: 'Grace', lastName: 'Kobia', gender: 'female', generation: 3,
    dateOfBirth: '1985-02-14', birthPlace: 'Nairobi, Kenya', occupation: 'Interior Designer' }),
  m({ id: 'm16', firstName: 'Michael', lastName: 'Omondi', gender: 'male', generation: 3,
    dateOfBirth: '1984-09-19', birthPlace: 'Kisumu, Kenya', occupation: 'Airline Pilot' }),

  // Generation 4 — great-grandchildren
  m({ id: 'm17', firstName: 'Brian', lastName: 'Kobia', gender: 'male', generation: 4,
    dateOfBirth: '2005-04-02', birthPlace: 'Nairobi, Kenya', occupation: 'University Student',
    hasPet: true, petName: 'Simba' }),
  m({ id: 'm18', firstName: 'Lucy', lastName: 'Kobia', gender: 'female', generation: 4,
    dateOfBirth: '2008-08-16', birthPlace: 'Nairobi, Kenya', occupation: 'High School Student',
    hasPet: true, petName: 'Milo' }),
  m({ id: 'm19', firstName: 'Kevin', lastName: 'Odhiambo', gender: 'male', generation: 4,
    dateOfBirth: '2010-12-01', birthPlace: 'Mombasa, Kenya', occupation: 'Student' }),
  m({ id: 'm20', firstName: 'Amani', lastName: 'Omondi', gender: 'female', generation: 4,
    dateOfBirth: '2012-05-27', birthPlace: 'Nairobi, Kenya', occupation: 'Student' }),

  // In-Law Families (Spouses' parents and siblings)
  // Alice Kaimenyi's family (m4's parents & brother)
  m({ id: 'm21', firstName: 'Jackson', lastName: 'Kaimenyi', gender: 'male', generation: 1,
    dateOfBirth: '1929-01-15', dateOfPassing: '2008-04-20', birthPlace: 'Maua, Kenya',
    restingPlace: 'Maua Family Land', occupation: 'Retired School Inspector',
    bio: 'Jackson was an esteemed educator in Meru North and founded Maua Methodist Academy.' }),
  m({ id: 'm22', firstName: 'Elizabeth', lastName: 'Kaimenyi', maidenName: 'M’Mwirichia', gender: 'female', generation: 1,
    dateOfBirth: '1933-05-18', birthPlace: 'Maua, Kenya', occupation: 'Retired Midwife',
    bio: 'Elizabeth delivered hundreds of babies across Meru North over a 40-year nursing career.' }),
  m({ id: 'm23', firstName: 'Timothy', lastName: 'Kaimenyi', gender: 'male', generation: 2,
    dateOfBirth: '1958-11-04', birthPlace: 'Maua, Kenya', occupation: 'Pharmacist' }),

  // Mary Otieno's family (m10's parents & sister)
  m({ id: 'm24', firstName: 'George', lastName: 'Otieno', gender: 'male', generation: 2,
    dateOfBirth: '1952-09-12', birthPlace: 'Kisumu, Kenya', occupation: 'Retired High Court Registrar' }),
  m({ id: 'm25', firstName: 'Grace', lastName: 'Otieno', maidenName: 'Adhiambo', gender: 'female', generation: 2,
    dateOfBirth: '1956-02-28', dateOfPassing: '2018-06-14', birthPlace: 'Kisumu, Kenya',
    restingPlace: 'Kisumu Memorial Gardens', occupation: 'High School Principal' }),
  m({ id: 'm26', firstName: 'Beatrice', lastName: 'Otieno', gender: 'female', generation: 3,
    dateOfBirth: '1984-04-16', birthPlace: 'Kisumu, Kenya', occupation: 'Financial Analyst' }),
];

let relId = 0;
const nextId = () => `r${++relId}`;

const spouse = (a: string, b: string, startedAt?: string): Relationship[] => [
  { id: nextId(), familyId: FAMILY_ID, fromMemberId: a, toMemberId: b, relationshipType: 'spouse', startedAt },
  { id: nextId(), familyId: FAMILY_ID, fromMemberId: b, toMemberId: a, relationshipType: 'spouse', startedAt },
];

const parentOf = (parentId: string, childId: string): Relationship => ({
  id: nextId(), familyId: FAMILY_ID, fromMemberId: parentId, toMemberId: childId, relationshipType: 'parent',
});

export const relationships: Relationship[] = [

  // Foundation Lineage: Kurirua (-2) -> M'Mbwiria (-1) -> Nkuruu (0)
  parentOf('b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004'),
  parentOf('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001'),

  // Nkuruu M'Mbwiria marriages (Two Wives)
  ...spouse('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '1920-01-01'), // First Wife: Salome Gateti
  ...spouse('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '1925-01-01'), // Second Wife

  // House of Salome Gateti (Gerald + 2 Full Brothers)
  parentOf('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0001-000000000011'),
  parentOf('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0001-000000000011'),
  parentOf('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0001-000000000012'),
  parentOf('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0001-000000000012'),
  parentOf('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0001-000000000001'),
  parentOf('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0001-000000000001'),

  // House of Second Wife (3 Stepbrothers)
  parentOf('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0001-000000000021'),
  parentOf('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0001-000000000021'),
  parentOf('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0001-000000000022'),
  parentOf('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0001-000000000022'),
  parentOf('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0001-000000000023'),
  parentOf('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0001-000000000023'),

  // Gerald & Lily
  ...spouse('b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0001-000000000002'),

  // Generation 2 — Children of Gerald & Lily
  parentOf('b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0002-000000000001'),
  parentOf('b0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0002-000000000001'),
  parentOf('b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0002-000000000002'),
  parentOf('b0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0002-000000000002'),
  parentOf('b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0002-000000000003'),
  parentOf('b0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0002-000000000003'),
  parentOf('b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0002-000000000004'),
  parentOf('b0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0002-000000000004'),
  parentOf('b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0002-000000000005'),
  parentOf('b0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0002-000000000005'),
  parentOf('b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0002-000000000006'),
  parentOf('b0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0002-000000000006'),
  ...spouse('m1', 'm2', '1950-06-10'),
  ...spouse('m3', 'm4', '1976-08-14'),
  ...spouse('m5', 'm6', '1977-03-19'),
  ...spouse('m7', 'm8', '1982-10-02'),
  ...spouse('m9', 'm10', '2003-07-12'),
  ...spouse('m11', 'm12', '2007-05-26'),
  ...spouse('m15', 'm16', '2009-12-05'),

  // In-law marriages
  ...spouse('m21', 'm22', '1953-12-20'),
  ...spouse('m24', 'm25', '1978-08-19'),

  parentOf('m1', 'm3'), parentOf('m2', 'm3'),
  parentOf('m1', 'm5'), parentOf('m2', 'm5'),
  parentOf('m1', 'm7'), parentOf('m2', 'm7'),

  parentOf('m3', 'm9'), parentOf('m4', 'm9'),
  parentOf('m3', 'm11'), parentOf('m4', 'm11'),
  parentOf('m5', 'm13'), parentOf('m6', 'm13'),
  parentOf('m5', 'm14'), parentOf('m6', 'm14'),
  parentOf('m7', 'm15'), parentOf('m8', 'm15'),

  parentOf('m9', 'm17'), parentOf('m10', 'm17'),
  parentOf('m9', 'm18'), parentOf('m10', 'm18'),
  parentOf('m11', 'm19'), parentOf('m12', 'm19'),
  parentOf('m15', 'm20'), parentOf('m16', 'm20'),

  // Alice's parents & sibling links
  parentOf('m21', 'm4'), parentOf('m22', 'm4'),
  parentOf('m21', 'm23'), parentOf('m22', 'm23'),

  // Mary's parents & sibling links
  parentOf('m24', 'm10'), parentOf('m25', 'm10'),
  parentOf('m24', 'm26'), parentOf('m25', 'm26'),
];

export const albums: Album[] = [
  { id: 'b0000000-0000-0003-000000000001', familyId: FAMILY_ID, title: "Gerald & Lily's Wedding & Family", category: 'weddings',
    description: 'Celebrating love and union in Meru.' },
  { id: 'b0000000-0000-0003-000000000002', familyId: FAMILY_ID, title: 'M\'Ikunyua Family Reunion', category: 'reunions',
    description: 'Generations of the M\'Ikunyua family gathered together.' },
  { id: 'b0000000-0000-0003-000000000003', familyId: FAMILY_ID, title: 'Childhood in Kinoru', category: 'childhood',
    description: 'Growing up on the slopes of Mount Kenya in Kinoru village.' },
  { id: 'b0000000-0000-0003-000000000004', familyId: FAMILY_ID, title: 'The Homestead & Farms, 1950s–1980s', category: 'historical',
    description: 'Early photographs of exotic dairy cattle, coffee farms, and the homestead.' },
  { id: 'b0000000-0000-0003-000000000005', familyId: FAMILY_ID, title: 'Remembering Senior Chief Gerald M\'Ikunyua', category: 'memorials',
    description: 'A tribute album honoring the legacy, leadership, and public service of Senior Chief Gerald M\'Ikunyua.' },
  { id: 'b0000000-0000-0003-000000000006', familyId: FAMILY_ID, title: 'Christmas at the Homestead', category: 'reunions',
    description: 'Annual festive gatherings and family traditions.' },
];

export const photos: Photo[] = [];

export const cookbookAlbums: CookbookAlbum[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: '📖 Traditional Family Cookbook', style: 'traditional',
    description: "A warm, heirloom-style book with recipes, food photos, and family-story sections — everything Naomi cooked, and everything her children and grandchildren still make in her memory.",
    featuredMemberId: 'm2' },
];

export const recipes: Recipe[] = [
  // Breakfast
  { id: 'rc1', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Naomi\'s Mandazi', category: 'breakfast',
    ingredients: ['3 cups all-purpose flour', '1/2 cup sugar', '2 tsp baking powder', '1/2 tsp ground cardamom', '1 cup coconut milk', '2 tbsp melted butter', 'Oil for frying'],
    instructions: ['Whisk the flour, sugar, baking powder, and cardamom together.', 'Stir in the coconut milk and melted butter until a soft dough forms.', 'Knead gently for 5 minutes, then rest covered for 30 minutes.', 'Roll out and cut into triangles.', 'Fry in medium-hot oil until golden on both sides, then drain on paper towels.'],
    familyStory: 'Naomi made these every Sunday before church, frying the first batch while the rest of the house was still asleep. The smell of cardamom drifting down the hallway was how her children knew what day it was.',
    contributedByMemberId: 'm4', createdAt: '2026-02-01T08:00:00Z' },
  { id: 'rc2', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Homestead Uji (Fermented Porridge)', category: 'breakfast',
    ingredients: ['2 cups millet or sorghum flour', '6 cups water', '1/2 cup plain yogurt or leftover uji for fermenting', 'Sugar or honey to taste'],
    instructions: ['Mix the flour with 2 cups of cold water into a smooth paste.', 'Stir in the yogurt, cover, and leave at room temperature for 24 hours to ferment slightly.', 'Bring the remaining water to a boil, then whisk in the fermented paste.', 'Simmer, stirring constantly, for 10 minutes until thickened.', 'Sweeten to taste and serve warm.'],
    familyStory: 'Reuben insisted on uji before any farm work — he used to say a man who skipped it "would be blown off the terraces by lunchtime."',
    contributedByMemberId: 'm3', createdAt: '2026-02-01T08:05:00Z' },

  // Main meals
  { id: 'rc3', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Sunday Vegetable Pilau', category: 'main',
    ingredients: ['2 cups basmati rice', '2 carrots, diced', '1 cup green peas', '2 potatoes, cubed', '1 onion, sliced', '3 cups vegetable stock', '1 tbsp pilau masala', '2 cloves, 1 cinnamon stick', 'Salt to taste'],
    instructions: ['Fry the onion in oil until deep golden, then add the cloves, cinnamon, and pilau masala.', 'Add the potatoes and carrots and stir to coat in the spices.', 'Stir in the rice, then pour in the vegetable stock and salt.', 'Bring to a boil, then cover and simmer on low heat for 20 minutes.', 'Fold in the peas for the last 5 minutes and let the pot rest, covered, before serving.'],
    familyStory: 'Every reunion at the homestead ends the same way: James at the stove arguing with Peter about how much cinnamon the pot really needs, while the grandchildren circle waiting for the first plate.',
    contributedByMemberId: 'm7', createdAt: '2026-02-01T08:10:00Z' },
  { id: 'rc4', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Naomi\'s Githeri', category: 'main',
    ingredients: ['3 cups maize and beans (mixed, soaked overnight)', '1 onion, chopped', '2 tomatoes, chopped', '2 carrots, diced', '1 tsp curry powder', 'Salt to taste'],
    instructions: ['Boil the soaked maize and beans until tender, about 1 hour.', 'In a separate pot, sauté the onion until soft, then add tomatoes and curry powder.', 'Add the carrots and cooked maize-beans mixture with a little of its cooking liquid.', 'Simmer together for 15 minutes and season with salt before serving.'],
    familyStory: 'This was the one dish Naomi could stretch to feed anyone who showed up unannounced — and in Nkubu, someone always did.',
    contributedByMemberId: 'm5', createdAt: '2026-02-01T08:15:00Z' },
  { id: 'rc5', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Mukimo (Mashed Greens & Potatoes)', category: 'main',
    ingredients: ['1 kg potatoes, peeled and cubed', '2 cups pumpkin leaves or spinach', '1 cup fresh maize kernels', '1 cup green peas', 'Salt to taste'],
    instructions: ['Boil the potatoes and maize together until soft.', 'Add the peas and greens for the last 5 minutes of cooking.', 'Drain, reserving a little cooking water, then mash everything together until well combined.', 'Season with salt and serve alongside stewed meat.'],
    familyStory: 'Alice learned to make this standing on a stool next to Naomi\'s cooking fire, and still mashes it the same way — "by feel, not by time," as Naomi used to say.',
    contributedByMemberId: 'm4', createdAt: '2026-02-01T08:20:00Z' },

  // Snacks
  { id: 'rc6', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Roasted Mahindi (Corn) with Chili-Lime', category: 'snacks',
    ingredients: ['4 ears fresh corn, husked', 'Juice of 2 limes', '1 tsp chili powder', 'Pinch of salt'],
    instructions: ['Roast the corn directly over hot coals, turning often, until lightly charred all over.', 'Mix the lime juice, chili powder, and salt.', 'Brush the mixture over the hot corn and serve immediately.'],
    familyStory: 'Sold from a cart just outside the Chogoria school gate — Naomi\'s students still say they can\'t smell roasted corn without thinking of her.',
    contributedByMemberId: 'm14', createdAt: '2026-02-01T08:25:00Z' },
  { id: 'rc7', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Vegetable Samosas', category: 'snacks',
    ingredients: ['2 potatoes, boiled and mashed', '1 cup green peas', '1 carrot, finely diced', '1 onion, finely chopped', '1 tsp curry powder', '1 tsp garam masala', 'Samosa pastry sheets', 'Oil for frying'],
    instructions: ['Sauté the onion and carrot until soft, then stir in the curry powder and garam masala.', 'Add the mashed potato and peas, mix well, and season with salt.', 'Cool the filling completely before assembling.', 'Fold the pastry into cones, fill, and seal the edges with a flour paste.', 'Deep-fry until golden and crisp, then drain before serving.'],
    familyStory: 'The 2019 reunion ran out of samosas twice — Ruth\'s now-legendary batch has become the thing every cousin asks about before they even arrive.',
    contributedByMemberId: 'm8', createdAt: '2026-02-01T08:30:00Z' },

  // Desserts
  { id: 'rc8', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Kaimati (Sweet Dumplings)', category: 'desserts',
    ingredients: ['2 cups flour', '1 tsp yeast', '1/2 cup sugar', '1 cup warm water', 'Oil for frying', '1 cup sugar syrup flavored with cardamom'],
    instructions: ['Mix the flour, yeast, sugar, and warm water into a thick batter; let rise for 1 hour.', 'Drop spoonfuls of batter into hot oil and fry until golden brown and puffed.', 'Drain briefly, then dip immediately into the warm cardamom syrup.', 'Serve warm or at room temperature.'],
    familyStory: 'Reserved for Christmas and big celebrations only — Naomi kept the syrup recipe a closely guarded secret until she finally taught it to Grace the year before she passed.',
    contributedByMemberId: 'm15', createdAt: '2026-02-01T08:35:00Z' },
  { id: 'rc9', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Sweet Potato & Coconut Pudding', category: 'desserts',
    ingredients: ['1 kg orange sweet potatoes, peeled and grated', '1 cup coconut milk', '1/2 cup sugar', '1/2 tsp ground cinnamon', '2 tbsp butter'],
    instructions: ['Mix the grated sweet potato with the coconut milk, sugar, and cinnamon.', 'Pour into a greased baking dish and dot with butter.', 'Bake at 180°C (350°F) for 45 minutes until set and golden on top.', 'Cool slightly before slicing and serving.'],
    familyStory: 'Naomi grew the sweet potatoes herself on the terrace closest to the house — Susan still plants that same patch every season "so the pudding tastes right."',
    contributedByMemberId: 'm5', createdAt: '2026-02-01T08:40:00Z' },

  // Main meals (vegetarian)
  { id: 'rc10', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Sukuma Wiki (Braised Collard Greens)', category: 'main', isVegetarian: true,
    ingredients: ['1 large bunch collard greens or kale, finely shredded', '1 onion, sliced', '2 tomatoes, chopped', '1 green bell pepper, sliced', '2 tbsp cooking oil', 'Salt to taste'],
    instructions: ['Heat the oil and sauté the onion until translucent.', 'Add the tomatoes and bell pepper and cook until softened.', 'Stir in the shredded greens a handful at a time, cooking until wilted.', 'Season with salt and simmer for 5 more minutes before serving alongside ugali or mukimo.'],
    familyStory: 'Naomi grew sukuma along the fence line so there was always a handful within reach — she used to say a homestead without greens by the door "wasn\'t really keeping house."',
    contributedByMemberId: 'm4', createdAt: '2026-02-01T08:45:00Z' },
  { id: 'rc11', albumId: 'c0000000-0000-0000-0000-000000000001', familyId: FAMILY_ID, title: 'Ndengu (Green Gram) Coconut Stew', category: 'main', isVegetarian: true,
    ingredients: ['2 cups green gram (ndengu), soaked overnight', '1 onion, chopped', '2 tomatoes, chopped', '1 cup coconut milk', '1 tsp curry powder', 'Salt to taste'],
    instructions: ['Boil the soaked green gram until tender, about 30–40 minutes, then drain.', 'Sauté the onion until soft, add the tomatoes and curry powder, and cook until it forms a thick base.', 'Stir in the cooked green gram and coconut milk.', 'Simmer for 10 minutes, season with salt, and serve with rice or chapati.'],
    familyStory: 'Catherine\'s go-to dish for Lent, learned over the phone from Alice one bite-by-bite Sunday call — it\'s now the first thing she teaches any cousin who says they "can\'t cook."',
    contributedByMemberId: 'm11', createdAt: '2026-02-01T08:50:00Z' },
];

export const memories: Memory[] = [
  { id: 'mem1', familyId: FAMILY_ID, title: "Grandmother's Wedding Day & The Silk Shawl (1950)",
    body: "Naomi wore her mother's silk shawl, hand-carried from Chogoria, and insisted the ceremony wait until the afternoon rains passed. The shawl is still kept in the cedar chest at the homestead.",
    era: '1950s', authorMemberId: 'm5',
    relatedMemberIds: ['m1', 'm2'], createdAt: '2020-03-01' },
  { id: 'mem2', familyId: FAMILY_ID, title: 'The Coffee Terraces Reuben Built',
    body: 'Reuben terraced the hillside by hand over two dry seasons so the rains would not wash away the topsoil. Those same terraces still produce the family\'s coffee today.',
    era: '1950s', authorMemberId: 'm3', relatedMemberIds: ['m1'], createdAt: '2020-03-05' },
  { id: 'mem3', familyId: FAMILY_ID, title: 'How James Nearly Missed His Own Graduation',
    body: 'James spent his last shillings helping a stranded matatu driver and had to walk twelve kilometers into town, arriving just as his name was called.',
    era: '1980s', authorMemberId: 'm7', relatedMemberIds: ['m7'], createdAt: '2021-06-14' },
];

export const events: FamilyEvent[] = [
  { id: 'ev1', familyId: FAMILY_ID, title: '2026 Family Reunion', eventType: 'reunion',
    description: 'Annual gathering at the Nkubu homestead — bring a dish for the potluck.', location: 'Nkubu Family Homestead',
    startsAt: '2026-12-27T10:00:00', endsAt: '2026-12-27T18:00:00',
    rsvps: [{ memberId: 'm9', status: 'going' }, { memberId: 'm11', status: 'going' }, { memberId: 'm13', status: 'maybe' }] },
  { id: 'ev2', familyId: FAMILY_ID, title: "Naomi's Memorial Remembrance", eventType: 'memorial',
    description: 'A quiet gathering to remember Naomi on her birthday.', location: 'Nkubu Family Land',
    startsAt: '2027-07-22T09:00:00', rsvps: [] },
  { id: 'ev3', familyId: FAMILY_ID, title: "Lucy's 18th Birthday", eventType: 'birthday',
    description: 'Coming of age celebration.', location: 'Nairobi', startsAt: '2026-08-16T17:00:00',
    rsvps: [{ memberId: 'm9', status: 'going' }] },
  { id: 'ev4', familyId: FAMILY_ID, title: 'Family Trust Planning Meeting', eventType: 'meeting',
    description: 'Discussing the future of the homestead land with all generation-2 & 3 members.',
    location: 'Video Call', startsAt: '2026-09-20T19:00:00', rsvps: [] },
];

export const announcements: Announcement[] = [
  { id: 'an1', familyId: FAMILY_ID, title: 'Reunion Date Confirmed', body: 'This year\'s reunion is set for December 27th at the homestead. Please RSVP by December 1st.', priority: 'important', postedByMemberId: 'm9', createdAt: '2026-08-01' },
  { id: 'an2', familyId: FAMILY_ID, title: 'Homestead Land Documents Needed', body: 'If anyone holds copies of the original 1951 land title, please contact John — we need them for the trust filing.', priority: 'urgent', postedByMemberId: 'm9', createdAt: '2026-08-20' },
  { id: 'an3', familyId: FAMILY_ID, title: 'Homestead Archive Updated', body: 'Family records and oral histories have been updated — thank you to everyone who contributed.', priority: 'normal', postedByMemberId: 'm14', createdAt: '2026-01-10' },
];

export const chronicleEras: ChronicleEra[] = [
  { id: 'ce1', familyId: FAMILY_ID, eraLabel: '1890s — Origins', sortOrder: 1,
    headline: 'The Kobia and Kiogora lineages take root on the slopes of Mount Kenya.',
    narrative: 'Long before Reuben and Naomi, both families farmed neighboring hills near Nkubu, tied together by trade routes and shared harvests.' },
  { id: 'ce2', familyId: FAMILY_ID, eraLabel: '1950s — A Union', sortOrder: 2,
    headline: 'Reuben Kobia marries Naomi Kiogora and founds the homestead.',
    narrative: 'The couple cleared and terraced the land that remains the family\'s anchor point to this day.' },
  { id: 'ce3', familyId: FAMILY_ID, eraLabel: '1970s–1980s — Expansion', sortOrder: 3,
    headline: 'The second generation marries out and the family grows to three branches.',
    narrative: 'Peter, Susan, and James each started their own households while returning to Nkubu each December.' },
  { id: 'ce4', familyId: FAMILY_ID, eraLabel: '1990s–2010s — Diaspora', sortOrder: 4,
    headline: 'The third generation moves to Nairobi, Mombasa, and abroad.',
    narrative: 'Careers in medicine, engineering, and aviation carried the family across Kenya and beyond, while the homestead remained the meeting point.' },
  { id: 'ce5', familyId: FAMILY_ID, eraLabel: '2020s — Modern Horizons', sortOrder: 5,
    headline: 'A fourth generation begins, and the family archive moves online.',
    narrative: 'Legacy Link now keeps the family\'s records, memories, and events in one place for every generation to come.' },
];

export const biographies: Biography[] = [
  {
    id: 'bio-gerald-ikunyua',
    familyId: FAMILY_ID,
    memberId: 'b0000000-0000-0000-0001-000000000001',
    professionalSummary: 'Gerald Kithinji M\'Ikunyua is the founding patriarch of the M\'Ikunyua family, an esteemed agricultural pioneer, and an influential public administrator in Meru and the wider Eastern and Rift Valley provinces of Kenya. Rising from humble beginnings as a herdsboy during the Second World War and Mau Mau emergency, he trained in animal husbandry, veterinary science, and dairy technology across Kenya, India, the United Kingdom, the United States, and Canada. He famously served as the 6th Senior Chief of Ntima Location since the colonial era, acted as District Officer for North Imenti, and served for decades as an Assistant Animal Production Officer in the Ministry of Livestock. He is widely celebrated for introducing exotic grade dairy cattle to Meru, establishing vital dairy and beekeeping cooperatives that thrive to this day, spearheading educational infrastructure (such as raising funds for the 8-4-4 system and rolling out Nyayo Milk in schools), and exemplifying unyielding integrity and resilience in the face of local political adversity.',
    earlyLifeBackground: 'Born on August 14th, 1937, in Kinoru village, Meru, Gerald was the third son born to Salome Gateti CioMuga and Nkuruu M\'Mbwiria. His father was a World War I veteran deployed to Dodoma, Tanzania, and had two wives, each blessed with three sons. Growing up in an environment primarily centered on grazing cows and goats with subsistence farming of bananas, yams, millet, and ncabi (black beans in Kithoka, 5 km away), Gerald’s childhood was shaped by pastoral duties and traditional communal life. At around age three, while left in his grandmother\'s care, he suffered severe burns after falling into the open three-stone hearth (riiko); with no modern hospitals nearby, his life and head were saved by traditional treatments using rabbit fur provided by his aunt Ciomero. In early childhood, he herded sheep and goats wrapped only in a light blanket for warmth, foraging for bush fruits, sharing nyungu ya mwanki (warm embers pots) during cold July mornings, and trapping ndera birds using usembu concoctions.',
    education: 'Gerald’s formal education began in January 1948 after persistently pleading with his father, who sold a goat for four shillings to pay his initial fees. He attended Mwirine Primary School, walking 5 km barefoot each morning with a slate and chalk, washing his single shirt and pair of shorts on Saturdays using riverside plants. In 1949, he transferred closer to home at DEB Mwithumwiru Primary School. In 1951, he sat for the Common Entrance Examination, scoring fourth in the region (behind future professor Mutuma Mugambi), qualifying for junior secondary boarding at Kaaga Boys Intermediate School (1952–1955), where he excelled in Rural Science, debate, and choir as choir master, paying his Ksh 35/year school fees by weeding coffee for Ksh 4 per month.\n\nAfter passing his Kenya African Preliminary Examination (KAPE) in 1955, he was admitted to Embu Agricultural Technical College. In 1956, he completed nursing training at Meru Hospital (appointed trainee ward in-charge). Choosing veterinary sciences over human medicine, he earned a Certificate in Animal Health at Kabete Veterinary College (1958). In 1964, sponsored through the Ministry and Indian hosts, he studied Mahatma Gandhi cottage industries (beekeeping, honey processing, cotton) in Bombay. In 1965, he was awarded a prestigious Commonwealth Senior Scholarship (earning a high student allowance of 350 Rupees per month) to study Dairy Husbandry at Punjab Agricultural University and the National Dairy Research Institute (Southern Station, Bangalore). He later pursued advanced agricultural and town planning training at the University of Guelph (Canada), Washington D.C. (USDA), and irrigation systems at the Hebrew University in Israel.',
    careerJourney: 'Gerald began his public service in January 1957 as a veterinary scout in Meru, managing government poultry and incubation units at Township. Following his studies at Kabete, in 1959 he was put in charge of the Githongo poultry and pig demonstration farm, and subsequently promoted to oversee veterinary services for North Imenti. In July 1975, after years of community organizing with the National Council of Churches of Kenya (NCCK) and serving as assistant settlement officer on ex-settler farms in Kitale, he was appointed Assistant Animal Production Officer in charge of Nithi Division (stationed at Chuka).\n\nIn July 1978, he transitioned to the Office of the President, succeeding Senior Chief Naaman as the Senior Chief of Ntima Location—the 6th Chief for Meru since European arrival. He underwent advanced executive administrative training at Maseno Government Training Institute and Embu DDC, often stepping in as Acting District Officer (DO) for North Imenti. Following political intrigues in 1982–1983, he briefly managed the British-sponsored National Goat Scheme at Marimanti, pioneered a large-scale commercial poultry and egg farm supplying military bases, and upon winning his landmark Public Service Commission appeal in January 1986, returned to the Ministry of Livestock as Assistant Animal Production Officer for Laikipia District (Nanyuki) until his retirement.',
    publicServiceChieftainship: 'As Senior Chief of Ntima Location from 1978 to 1982, Gerald established exemplary civil governance, community policing, and social development. He maintained rigorous local intelligence and security across Makutano and Meru town, virtually eliminating daylight vagrancy, petty crime, and illicit chang\'aa brewing. During the inception of the 8-4-4 education system, he mobilized community fundraising, collecting over Ksh 600,000 for school classroom expansions deposited directly into the Ntima location development account. He oversaw the historic rollout of the Nyayo Milk distribution across primary schools. His leadership was recognized across the provincial administration, regularly earning him acting appointments as District Officer for North Imenti.',
    agriculturalPioneering: 'Gerald was one of the central figures responsible for modernizing dairy and livestock farming in Mount Kenya East. Between 1959 and 1961, against widespread skepticism during the pre-independence transition, he tirelessly educated and convinced Meru smallholders to invest in high-yielding exotic and grade dairy cows (sold at Ksh 700 each), transforming rural household income. In Chuka and Tharaka Nithi, he revived the struggling Ciangoi Dairy Society and Muthambi Dairy Society back to full operational strength. Recognizing the economic potential of apiculture, he organized traditional honey hunters into the landmark Mutindwa jwa Mbogori Forest Beekeepers Group, securing formal government forestry permits for sustainable honey production—a cooperative that remains active decades later. In the 1980s, facing temporary retirement, he built commercial poultry houses for 300+ layers, supplying eggs across Nanyuki, Isiolo, Maua, Embu, and Kirinyaga, and winning major institutional tenders for the Kenya Army barracks in Isiolo.',
    internationalTravels: 'Across four decades, Gerald traveled extensively as an ambassador for Kenyan agriculture, the Methodist Church, and civic governance:\n• India (1964–1966): Undertook a 9-day sea voyage from Mombasa to Bombay; studied rural cottage industries under Mahatma Gandhi\'s self-reliance model; completed advanced Dairy Husbandry studies in Punjab and Bangalore under a Commonwealth Senior Scholarship.\n• Tanzania (1969): Agricultural study and exchange tour.\n• Europe & North America (1970s): Represented the Kenya Methodist Conference at the British Methodist Conference in Manchester; represented the Kenya Guernsey Society in Guernsey Islands (Channel Islands); represented the Friesian Cattle Society of Kenya in the Netherlands; raised 150,000 Dutch guilders for water irrigation at Kaaga and Tharaka Secondary Schools; studied urban planning in Boston and Washington D.C.; trained in agriculture at the University of Guelph (Canada); and evaluated irrigation technologies at the Hebrew University of Jerusalem under Kenya-Israel bilateral cooperation.\n• Middle East (1985): Member of the Kenya Chamber of Commerce trade delegation to Dubai, Abu Dhabi, Oman, Qatar, and Saudi Arabia exploring export markets for Kenyan agricultural produce, coffee, and eggs.\n• Britain & Channel Islands (1992): Official return visit for agricultural and pastoral conferences.',
    historicalContext: 'Gerald lived through and directly participated in key turning points in Kenyan history:\n• World War II (1939–1945): Remembers hearing the bombing of Isiolo in ~1944 and being told to take cover beneath banana groves.\n• Mau Mau Emergency (1952–1956): On October 20, 1952, the state of emergency was declared. During subsequent armed attacks on Kaaga Boys Intermediate environs in 1953 and 1954, Gerald was stationed sleeping in the school hall as the designated alarm bell-ringer, tasked with waking the dormitory to take cover under beds whenever the AP guards sounded their whistles.\n• Transition to Independence (1959–1963): Navigated intense political headwinds while urging farmers to adopt modern agricultural methods despite widespread rumors that independence would bring free cattle.\n• Transition of Power (August 1978): Just one month after assuming the Senior Chieftainship of Ntima, President Jomo Kenyatta passed away on August 12, 1978. Gerald managed local peace and order in Meru during days of profound national uncertainty as businesses shuttered and President Daniel arap Moi took office.\n• 1980s Politics: Navigated fierce district rivalries between veteran Cabinet Minister Jackson Angaine and Nteere Mbogori, upholding professional civil service neutrality despite partisan pressures.',
    culturalHeritage: 'Gerald was deeply grounded in Meru heritage. He was circumcised in December 1951, entering into the Meru age-set following the Kaburu (Nkunja) / Ntalu Mbaya Ntiwiko generation. In 1961, he made a courageous cultural statement by purchasing his first heifer from Kitale stock while still a bachelor, defying the entrenched Kimeru customary belief that buying cattle prior to marriage would render a man childless. His bold decision dispelled the superstition among his peers and initiated a lifetime of prosperous herd ownership.',
    adversityAndResilience: 'Gerald\'s life is a testament to perseverance against impossible odds. He overcame debilitating childhood burns without medical clinics, walked 10 kilometers daily through territorial rivalries in town, and endured painful jigger extractions and poverty to complete primary school. When expelled from Embu Technical School in 1956 alongside a third of his class, he did not despair; he immediately qualified for nursing, and later bravely confronted the matron with his folded uniform to pursue his true passion in veterinary medicine.\n\nIn February 1982, while taking his daughter Jane Kathure to Moi Girls High School in Nairobi and attending to personal affairs on authorized leave, he fell victim to local political malice during the visit of the retiring Eastern Provincial Commissioner, leading to an abrupt suspension based on five trumped-up charges. Rather than breaking, Gerald methodically appealed to the Permanent Secretary of Internal Security and the Public Service Commission. When political interference delayed his petition, he pivoted to commercial poultry farming, famously appearing on the front page of The Standard newspaper in November 1985 when egg marketing cartels blocked his harvest. In January 1986, the Public Service Commission fully vindicated him, restoring his rank, civil service standing, and 3 years of back-pay and pension rights.',
    professionalAchievements: '• 6th Senior Chief of Ntima Location and Acting DO of North Imenti.\n• Pioneer of exotic grade dairy cattle in Central and North Imenti.\n• Co-founder and mentor of Ciangoi Dairy Society, Muthambi Dairy Society, and Mutindwa Beekeepers Association.\n• Recipient of the Commonwealth Senior Scholarship for Dairy Husbandry (India).\n• Successfully fundraised 150,000 Dutch guilders for school water irrigation infrastructure in Kaaga and Tharaka.\n• Spearheaded Ksh 600,000 in school infrastructure development for the introduction of the 8-4-4 education curriculum in Ntima.\n• Established high-capacity commercial egg distribution networks supplying the Kenya Army barracks in Isiolo.',
    areasOfExpertise: ['Public Administration', 'Animal Husbandry', 'Dairy Technology', 'Agricultural Cooperatives', 'Community Policing', 'Apiculture (Beekeeping)', 'Poultry Farming', 'Educational Infrastructure', 'International Diplomacy & Fundraising'],
    communityContributions: 'Lifelong champion of education and rural livelihoods. Served as Chairman of Kinoru Church (1972–1974), Board Chairman for local secondary schools, lay preacher, and mentor to emerging farmers across Meru, Tharaka, and Laikipia. Mobilized school fees and community Harambees for underprivileged students, ensuring multiple generations attained secondary and technical schooling.',
    personalPhilosophy: 'Gerald believed passionately in self-reliance, technical skill, and unwavering moral fortitude: "Civil service belongs to the people and the government of the day, not to political factions." He modeled the dignity of agricultural labor, demonstrating that modern farming, discipline, and education are the truest pathways to African economic liberation.',
    legacy: 'Remembered as a visionary builder who bridged traditional Meru life and modern Kenyan nation-building. His legacy endures in the dairy herds grazing across Mount Kenya, the beekeeping traditions of Mutindwa forest, the schools built under his chieftainship, and the generations of children and grandchildren of the M\'Ikunyua family whom he inspired to seek education, travel the globe, and stand tall with courage.',
    personalLife: 'Married to Lily Ncurubi, whom he first met in 1956 while working at Meru Hospital while she was a student at Kaaga Girls Intermediate School. Together, they raised six children: Thomas Muriithi, Timothy Mwirigi, Jane Kathure, Martin Gitari, Betty Karwitha, and Edwin Kimathi, and are blessed with twelve grandchildren. Gerald was a keen sportsman with certificates in volleyball, lawn tennis, and hockey, and enjoyed golf and travel throughout his life.',
    updatedAt: '2026-10-12T16:00:00Z',
  },
  {
    id: 'bio-lily-ncurubi',
    familyId: FAMILY_ID,
    memberId: 'b0000000-0000-0000-0001-000000000002',
    professionalSummary: 'Lily Ncurubi is the beloved matriarch of the M\'Ikunyua family, an astute businesswoman, community pillar, and the steadfast anchor of the household throughout Senior Chief Gerald M\'Ikunyua\'s long public, agricultural, and administrative career. Educated at Kaaga Girls Intermediate School, she was known across Kinoru and Meru for her commercial acumen, quiet strength, and organizational brilliance. She is famously celebrated in family history for her decisive entrepreneurship in late 1985 when, while Gerald was away on a trade delegation in the Middle East, she single-handedly mobilized distribution and sold all 500 crates of eggs stored on their farm, rescuing the family\'s commercial enterprise during a national market crisis.',
    earlyLifeBackground: 'Lily was born and raised in Meru, hailing from a respected family closely connected to the pioneering educational community of Kaaga and Embu. She was a close relative to Timothy Kinyua (who studied at Embu Agricultural Technical College) and shared community and schooling ties with Gerald’s Kaaga classmates. Her youth was characterized by discipline, Christian diligence, and academic dedication during the transformative era of the 1950s in Meru.',
    education: 'Lily attended Kaaga Girls Intermediate School, reaching Class 6 in 1956—a distinguished educational attainment for young women in Mount Kenya East during the colonial period. Her schooling grounded her in literacy, bookkeeping, home sciences, and leadership that would define her life as a community leader and farm enterprise manager.',
    careerJourney: 'From the inception of their marriage, Lily was the co-architect and operational backbone of the M\'Ikunyua family enterprises. While Gerald served in government veterinary postings, international study tours, and chieftainship, Lily oversaw daily operations at the Kinoru homestead. She managed their dairy herd, cash crops, and commercial poultry units. During the 1980s, she managed local egg sales across Meru, coordinating orders, supply logistics, and client accounts.',
    agriculturalPioneering: 'Partnered with Gerald in managing high-yield grade cattle and commercial poultry farming. When the family ventured into commercial egg production with over 300 layers, Lily managed daily egg collection, sorting, storage, and retail sales across Meru and neighboring markets.',
    historicalContext: 'Witnessed firsthand the Mau Mau emergency in Mount Kenya East, the expansion of Methodist mission education at Kaaga, Kenya\'s birth as an independent republic in 1963, and the succession of presidents. During the political tensions of the 1980s that saw Gerald unfairly suspended from public office, Lily was the steady, calming presence who ensured the household remained self-reliant and dignified.',
    culturalHeritage: 'Embodied the highest ideals of Kimeru womanhood, grace, and community solidarity. She supported Gerald in 1961 when he courageously broke with traditional superstition to purchase their first heifer prior to marriage, proving that faith and progress go hand in hand.',
    adversityAndResilience: 'Steadfastly anchored the home during Gerald\'s extensive travels abroad—including his two-year scholarship in India (1964–1966), agricultural tours across Europe, America, and Israel, and his civil service postings in Kitale, Chuka, and Nanyuki. Her resilience culminated in November 1985 when, facing 500 crates of unsold eggs and marketing bottlenecks, she personally took charge of distribution and cleared the entire store before Gerald returned from Dubai and Saudi Arabia.',
    professionalAchievements: '• Educated at Kaaga Girls Intermediate School (Class 6, 1956).\n• Co-founded and steered the M\'Ikunyua agricultural and poultry enterprises in Kinoru.\n• Successfully raised six university-educated children who have become leaders across education, engineering, commerce, and public life.\n• Renowned community counselor and matriarch across Kinoru.',
    areasOfExpertise: ['Agribusiness Management', 'Poultry Operations', 'Rural Commerce', 'Family Stewardship', 'Community Mentorship', 'Hospitality'],
    communityContributions: 'Devoted member of the Kinoru church community, actively supporting women\'s fellowships, local educational Harambees, and extending warm hospitality to local leaders and international agricultural visitors from the UK, Netherlands, and North America.',
    personalPhilosophy: 'Lily lived by the quiet conviction that a family thrives through hard work, loyalty, and unwavering faith: "A home is built not on words, but on steady hands, prayer, and standing together through every season."',
    legacy: 'Her greatest legacy lives in the strong, educated, and united M\'Ikunyua family. Her memory is preserved through her children, twelve grandchildren, and her namesake granddaughter, Lily Kimathi. She is remembered as the indispensable foundation upon which the family\'s modern success was built.',
    personalLife: 'Met Gerald Kithinji M\'Ikunyua in 1956 at Meru Hospital while she was a student at Kaaga Girls Intermediate School. Together, they shared a lifelong marriage and raised six children: Thomas Muriithi, Timothy Mwirigi, Jane Kathure, Martin Gitari, Betty Karwitha, and Edwin Kimathi, who blessed them with twelve grandchildren.',
    updatedAt: '2026-10-12T16:00:00Z',
  },
  {
    id: 'bio1', familyId: FAMILY_ID, memberId: 'm1',
    professionalSummary: 'Reuben Kobia was a coffee farmer and respected community elder, known in the family for his quiet determination and dry sense of humor. He built a life around farming, faith, and a homestead that still gathers the family every December.',
    earlyLifeBackground: 'Reuben was the third of five children born to a smallholder family on the eastern slopes of Mount Kenya, near Nkubu. He grew up herding goats before and after school, and often said the hills taught him patience long before any teacher did. His mother kept a small kitchen garden that, family lore says, is where his own love of farming took root.',
    education: 'Reuben completed primary schooling locally near Nkubu; the rest of his education came from working the land alongside his father and, later, from the Njuri Ncheke council of elders.',
    careerJourney: 'After finishing school, Reuben worked briefly on a colonial-era tea estate before saving enough to lease his first plot of land. In 1951 he founded the family homestead near Nkubu and planted the coffee terraces that still bear fruit today, farming that land for the rest of his working life.',
    professionalAchievements: 'Reuben spent two dry seasons terracing the hillside by hand so the rains wouldn\u2019t wash away the topsoil \u2014 those same terraces still produce the family\u2019s coffee today. He was also a respected member of the local Njuri Ncheke council of elders and was known for mediating land disputes fairly.',
    areasOfExpertise: ['Coffee Farming', 'Land Stewardship', 'Community Mediation'],
    communityContributions: 'As a member of the Njuri Ncheke council of elders, Reuben mediated land disputes across the area and was known for his fairness. Neighbors regularly sought his counsel on farming and family matters alike.',
    personalPhilosophy: 'Reuben believed patience and steady work outlasted any shortcut, and that land cared for properly would care for the family in return. He insisted every child learn to work the land, "even the ones who\u2019d rather read."',
    legacy: 'Reuben passed on a fierce attachment to the homestead land and a belief that a family that works together stays together. The coffee terraces he built by hand remain the family\u2019s anchor point, and "taste where you come from" has become something of a family motto.',
    personalLife: 'Reuben and Naomi married in 1950 and raised five children on the Nkubu homestead. He never used a watch, telling time instead by the shadow-sm of a particular fig tree on the property \u2014 and he was rarely wrong. He also had a habit of pressing a fresh coffee cherry into the hand of any grandchild who visited, saying "taste where you come from." In his later years he handed day-to-day farming over to his sons but walked the terraces every morning until his health no longer allowed it, and kept a running, informal scoreboard of who could climb the fig tree fastest.',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'bio2', familyId: FAMILY_ID, memberId: 'm2',
    professionalSummary: 'Naomi Kobia, n\u00e9e Kiogora, was a teacher and the family\u2019s unofficial historian. Warm and quietly formidable, she taught three generations of children and kept the family\u2019s oral history alive through song.',
    earlyLifeBackground: 'Naomi grew up in Chogoria as the eldest daughter in a family of teachers, which shaped her own path early on. Her mother\u2019s silk shawl, carried from a much earlier generation, became a treasured family heirloom that Naomi herself would one day wear at her wedding.',
    education: 'Naomi trained as a teacher, following the family tradition, and qualified in her early twenties before taking up her first post.',
    careerJourney: 'Naomi took her first teaching post at Chogoria Primary School in her early twenties \u2014 a job she would return to, on and off, for the next three decades, eventually retiring from the classroom after a lifetime of teaching.',
    professionalAchievements: 'Beyond the classroom, Naomi was the family\u2019s unofficial historian, singing songs and telling stories that traced the family back well before Reuben and Naomi themselves. She was also known throughout Chogoria for her singing voice.',
    areasOfExpertise: ['Primary Education', 'Oral History', 'Music'],
    communityContributions: 'Naomi taught three generations of children in Chogoria and was widely known and respected throughout the community for her singing voice and her care for her students.',
    personalPhilosophy: 'Naomi believed a family\u2019s story was as important as its land, and made a point of passing it down through song and storytelling so no one would forget where they came from.',
    legacy: 'Naomi\u2019s legacy is the family\u2019s sense of its own story \u2014 she made sure no one forgot where they came from. The cedar chest and its silk shawl are still kept at the homestead, brought out for every family wedding since.',
    personalLife: 'Naomi married Reuben in 1950, insisting the ceremony wait until the afternoon rains passed, and raised five children on the Nkubu homestead while continuing to teach. She kept her mother\u2019s silk shawl in a cedar chest and would only bring it out for weddings, saying it "remembered every one of them." She also had a habit of grading her grandchildren\u2019s report cards as if they were still her own students. After retiring from teaching, she spent her later years tending her garden and hosting Sunday lunches the whole family looked forward to, and continued singing well into her seventies.',
    updatedAt: '2026-01-15T09:00:00Z',
  },
];


export const legacyContributions: LegacyContribution[] = [
  {
    id: 'lc1', familyId: FAMILY_ID, memberId: 'm1', authorProfileId: 'prof1', authorName: 'John Kobia',
    body: 'Every time I taste our own coffee I think of him pressing a cherry into my hand as a kid. That habit alone taught me more about where I come from than any history lesson.',
    taggedMemberIds: ['m1'], createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'lc2', familyId: FAMILY_ID, memberId: 'm1', authorProfileId: 'prof3', authorName: 'Faith Muthomi',
    body: 'Grandpa Reuben settled every argument at family gatherings just by standing up slowly and clearing his throat. Never raised his voice once that I can remember.',
    taggedMemberIds: ['m1', 'm6'], createdAt: '2026-03-11T14:30:00Z',
  },
];

// Seed entries for the family's Kimeru language dictionary — a mix of everyday
// words, a traditional greeting, a family-remembered proverb, and a riddle,
// each with who contributed it. Kimeru has several dialects (Imenti, Tigania,
// Igembe, Chuka, and others), so spelling naturally varies a little between
// homesteads — the dictionary is built for exactly that kind of imperfect,
// remembered-by-family contribution, not a certified reference.
export const languageEntries: LanguageEntry[] = [
  {
    id: 'lang_featured',
    familyId: FAMILY_ID,
    entryType: 'saying',
    term: 'A tree does not forget its roots.',
    meaning: 'No matter how high you climb or where life takes you, your family origin and ancestors remain the soil that nourishes your strength.',
    storyBehind: 'Grandma Naomi used to gather the grandchildren around the old fig tree during every December reunion and share this to remind the younger generation of where the family began.',
    language: 'English / Meru',
    category: 'Family Wisdom',
    yearRecorded: '1987',
    location: 'Nkubu, Kenya',
    saidByMemberId: 'm2',
    contributedByProfileId: 'prof2',
    contributedByName: 'Catherine Kobia',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'lang_baobab',
    familyId: FAMILY_ID,
    entryType: 'proverb',
    term: 'Wisdom is like a baobab; no one person can embrace it.',
    meaning: 'Wisdom is vast and cannot be kept by one person. It is meant to be shared, learned, and passed on across generations.',
    storyBehind: 'Grandpa Reuben recited this when resolving homestead and community matters, explaining that even the wisest elders learn by listening to others.',
    language: 'Kikuyu',
    category: 'Wisdom',
    yearRecorded: '1965',
    location: 'Meru, Kenya',
    saidByMemberId: 'm1',
    contributedByProfileId: 'prof1',
    contributedByName: 'John Kobia',
    createdAt: '2026-01-12T09:00:00Z',
  },
  {
    id: 'lang_mama',
    familyId: FAMILY_ID,
    entryType: 'saying',
    term: 'Heri ya mama, daima ni baraka.',
    meaning: 'A mother\'s blessing is always a blessing — maternal goodwill and prayers guide and protect children throughout life.',
    storyBehind: 'Naomi always spoke these words over her children before every journey, new school term, or important life decision.',
    language: 'Swahili',
    category: 'Family Wisdom',
    yearRecorded: '1982',
    location: 'Chogoria, Kenya',
    saidByMemberId: 'm2',
    contributedByProfileId: 'prof2',
    contributedByName: 'Catherine Kobia',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'lang_workhard',
    familyId: FAMILY_ID,
    entryType: 'elder_wisdom',
    term: 'Work hard, stay humble, and let God handle the rest.',
    meaning: 'Put your hands and heart into honest labor without pride, and trust Providence for the outcome.',
    storyBehind: 'Passed down by Reuben while terracing the hillside fields by hand with his sons Peter and James over two dry seasons.',
    language: 'English',
    category: 'Life Lessons',
    yearRecorded: '1990',
    location: 'Nkubu, Kenya',
    saidByMemberId: 'm1',
    contributedByProfileId: 'prof1',
    contributedByName: 'John Kobia',
    createdAt: '2026-01-20T11:00:00Z',
  },
  {
    id: 'lang_utu',
    familyId: FAMILY_ID,
    entryType: 'story',
    term: 'Utu ni wema.',
    meaning: 'Humanity is kindness — true character is revealed by how generously one treats relatives, neighbors, and strangers alike.',
    storyBehind: 'Alice recalled how the family shared their harvest and housed stranded travelers during the drought season of 1978 without asking for anything in return.',
    language: 'Kikuyu / Swahili',
    category: 'Kindness & Community',
    yearRecorded: '1978',
    location: 'Maua, Kenya',
    saidByMemberId: 'm4',
    contributedByProfileId: 'prof3',
    contributedByName: 'Faith Muthomi',
    createdAt: '2026-01-25T12:00:00Z',
  },
  {
    id: 'lang_tree_wind',
    familyId: FAMILY_ID,
    entryType: 'proverb',
    term: 'Mti mkuu hauanguki kwa upepo.',
    meaning: 'A tall, deeply rooted tree does not fall in the wind — deep roots in family and integrity withstand any adversity.',
    storyBehind: 'Shared by Reuben during difficult farming seasons to encourage the homestead to remain united and steadfast.',
    language: 'Kikuyu',
    category: 'Resilience',
    yearRecorded: '1968',
    location: 'Nkubu, Kenya',
    saidByMemberId: 'm1',
    contributedByProfileId: 'prof1',
    contributedByName: 'John Kobia',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'lang_kazi',
    familyId: FAMILY_ID,
    entryType: 'expression',
    term: 'Kazi ni ibada.',
    meaning: 'Work is worship — performing one\'s daily responsibilities with devotion and honor is a sacred contribution to the family.',
    storyBehind: 'A guiding family motto engraved above the doorway of the coffee sorting storehouse at the homestead.',
    language: 'Swahili',
    category: 'Work Ethic',
    yearRecorded: '2001',
    location: 'Nkubu Family Land',
    saidByMemberId: 'm3',
    contributedByProfileId: 'prof3',
    contributedByName: 'Faith Muthomi',
    createdAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'lang1', familyId: FAMILY_ID, entryType: 'word', term: 'Nyomba',
    meaning: 'House / home — the family homestead in Nkubu that still gathers everyone every December.',
    storyBehind: 'The word used for both the physical roof and the ancestral lineage that holds us together.',
    language: 'Kimeru',
    category: 'Heritage',
    yearRecorded: '1951',
    location: 'Nkubu, Kenya',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'lang2', familyId: FAMILY_ID, entryType: 'word', term: 'Muka',
    meaning: 'Wife.',
    language: 'Kimeru',
    category: 'Heritage',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-02-11T09:30:00Z',
  },
  {
    id: 'lang3', familyId: FAMILY_ID, entryType: 'word', term: 'Kaana',
    meaning: 'Child.',
    language: 'Kimeru',
    category: 'Heritage',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-02-12T11:00:00Z',
  },
  {
    id: 'lang4', familyId: FAMILY_ID, entryType: 'phrase', term: 'Muga? — Muga mono.',
    meaning: 'A traditional greeting exchange from the Imenti dialect around Meru town: "Muga?" ("Hello?") is answered with "Muga mono" ("Hello indeed"). Elders still greet visitors arriving at the homestead this way.',
    storyBehind: 'Traditional greeting still spoken by elders whenever family members return home.',
    language: 'Kimeru',
    category: 'Greetings',
    yearRecorded: '1950',
    location: 'Nkubu, Kenya',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-02-15T14:00:00Z',
  },
  {
    id: 'lang5', familyId: FAMILY_ID, entryType: 'proverb', term: 'Gĩkundĩ kĩnene gĩtiumaga na mũndũ ũmwe.',
    meaning: 'No big gathering comes from one person alone — the family only grows strong when everyone contributes. A saying Grandma Naomi liked to repeat at reunions.',
    storyBehind: 'Grandma Naomi liked to repeat this at every reunion dinner.',
    language: 'Kimeru',
    category: 'Unity',
    yearRecorded: '1975',
    location: 'Nkubu, Kenya',
    saidByMemberId: 'm2',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-05T16:20:00Z',
  },
  {
    id: 'lang6', familyId: FAMILY_ID, entryType: 'riddle', term: 'Nĩ kĩĩ kĩrĩ na maithori tũnyinya no gĩtiũragwo?',
    meaning: 'What weeps constantly but is never hurt? Riddles like this were traditionally traded between children in the evenings around the fire.',
    answer: 'Mbura (the rain).',
    language: 'Kimeru',
    category: 'Riddles & Play',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-12T18:45:00Z',
  },
  {
    id: 'lang7', familyId: FAMILY_ID, entryType: 'saying', term: '"Taste where you come from."',
    meaning: 'What Grandpa Reuben said every time he pressed a fresh coffee cherry into a grandchild’s hand — his way of tying the family back to the land.',
    storyBehind: 'Reuben never wore a watch; he tracked time by the trees and instilled pride in the soil.',
    language: 'English',
    category: 'Family Wisdom',
    yearRecorded: '1955',
    location: 'Nkubu Coffee Terraces',
    saidByMemberId: 'm1',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-15T09:10:00Z',
  },
  {
    id: 'lang8', familyId: FAMILY_ID, entryType: 'saying', term: '"A visitor never leaves this house hungry."',
    meaning: 'Grandma Naomi’s standing rule for the homestead — she’d start cooking the moment she heard a car on the drive.',
    storyBehind: 'Naomi kept a warm pot of stew and tea ready for whoever walked through the homestead gates.',
    language: 'English',
    category: 'Hospitality',
    yearRecorded: '1960',
    location: 'Nkubu Homestead',
    saidByMemberId: 'm2',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-16T12:00:00Z',
  },
  {
    id: 'lang9', familyId: FAMILY_ID, entryType: 'proverb', term: 'Agiicuria ta kireere naiji uria akareera',
    meaning: 'When he hangs himself down like a bat, he definitely knows how he would float through the air.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T08:00:00Z',
  },
  {
    id: 'lang10', familyId: FAMILY_ID, entryType: 'proverb', term: 'Agwikia jua nduu kaara',
    meaning: 'He has inserted a finger into the anus of the monster — meaning, one has tried a very dangerous feat.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T08:05:00Z',
  },
  {
    id: 'lang11', familyId: FAMILY_ID, entryType: 'proverb', term: 'Agwikirithania na murampa',
    meaning: 'He has rubbed shoulders against a baobab tree — meaning, he wants to compare himself with a giant. He wants to look big.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-18T08:10:00Z',
  },
  {
    id: 'lang12', familyId: FAMILY_ID, entryType: 'proverb', term: 'Akagwata gikama mwanki-ukwora (jukwora)',
    meaning: 'He would get hold of a red-hot iron brand just after it has left the fire. The gikama was a piece of metal used in a trial ordeal to determine the guilt or innocence of an accused thief, carried with naked hands across a given distance — dropping it proved thievery. The proverb warns of the consequences of thievery.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T08:15:00Z',
  },
  {
    id: 'lang13', familyId: FAMILY_ID, entryType: 'proverb', term: 'Akwina abicha',
    meaning: 'He has danced topsy-turvy (upside down). Similar to "Akwina atema ntabui" ("he has danced amazingly beyond") and "Akwina atura nturi" ("he has danced amazingly to the end"). Means too much of a good thing might be bad — he has danced himself to death.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T08:20:00Z',
  },
  {
    id: 'lang14', familyId: FAMILY_ID, entryType: 'proverb', term: 'Ari mutine jukuura',
    meaning: 'He is under a leaking tree — meaning, he is having problems.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-18T08:25:00Z',
  },
  {
    id: 'lang15', familyId: FAMILY_ID, entryType: 'proverb', term: 'Bia thuguri bitiujuraga ncuku',
    meaning: 'Bartered grains do not fill up the granary — one should not expect to be self-sufficient without cultivating land.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T08:30:00Z',
  },
  {
    id: 'lang16', familyId: FAMILY_ID, entryType: 'proverb', term: 'Cookera akui, Nturutimi yacookeere Nciru',
    meaning: 'Return before you go further — Nturutimi returned after it had reached Mciru. Nturutimi was one of the age groups in Meru; Mciru is where the Njuri-Ncheke Council of Elders met to formulate the rules and customs governing Meru life. The proverb warns against pushing past a decision that is already binding and final.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T08:35:00Z',
  },
  {
    id: 'lang17', familyId: FAMILY_ID, entryType: 'proverb', term: 'Naanga yereragua ni ruuo',
    meaning: 'The naanga flies with the wind. A naanga is a soft printed cotton cloth worn over the shoulders by dancing Meru warriors, flying behind each dancer as a beautiful bunting. Possibly means to swim with the current, to go with the flow.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-18T08:40:00Z',
  },
  {
    id: 'lang18', familyId: FAMILY_ID, entryType: 'proverb', term: 'Nagwurite kareere maigo',
    meaning: 'He has extracted the bat\u2019s teeth — he has done something extraordinary.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T08:45:00Z',
  },
  {
    id: 'lang19', familyId: FAMILY_ID, entryType: 'proverb', term: 'Ncamba ti matina',
    meaning: 'The strength of a hero does not centre on his buttocks. Also "Ncamba ti biuriu" ("the strength of a hero is not displayed by the calves of his legs"). One\u2019s fame and strength are not determined by appearance or physical force, but by intelligence and other qualities.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T08:50:00Z',
  },
  {
    id: 'lang20', familyId: FAMILY_ID, entryType: 'proverb', term: 'Ndara mugumone itiji ndaara mugene nikumuntwa',
    meaning: 'One (a bird) that spends the night on a fig-tree does not know that the other, passing the night on a thorny cactus tree, is being pricked.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-18T08:55:00Z',
  },
  {
    id: 'lang21', familyId: FAMILY_ID, entryType: 'proverb', term: 'Ndiita na (Mwirigo) Juu juri iraa kana juria juri nondo',
    meaning: 'Should I follow the route with clay soil, or the one with ochre? The Meru believed in two imaginary roads in life: the white "clay" road of light, connected to Ngai the Creator; and the red "ochre" road, connected with fear and bloodshed — warriors wore ochre before going to war. Used when one faces a dilemma.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 'lang22', familyId: FAMILY_ID, entryType: 'saying', term: 'Ni-kae karumirwa ka nyeenje kaguruke na ruuo',
    meaning: 'Let it be a bite of a cockroach and fly with the wind — an expression used for soothing a hurt child.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T09:05:00Z',
  },
  {
    id: 'lang23', familyId: FAMILY_ID, entryType: 'proverb', term: 'Niku gwatuka maguru ta mbiti',
    meaning: 'It is halving one\u2019s body into two, like a hyena — similar to "he who hunts two hares leaves one and loses the other." A hyena chasing a goat reached a fork in the path and, greedy to cover both routes, placed its legs on each path and tore itself in two. Warns against trying to have everything at once.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-18T09:10:00Z',
  },
  {
    id: 'lang24', familyId: FAMILY_ID, entryType: 'proverb', term: 'Niku kwenja nkari igoti',
    meaning: 'It is to shave the leopard\u2019s mane — to undertake a very dangerous and nerve-wracking venture.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T09:15:00Z',
  },
  {
    id: 'lang25', familyId: FAMILY_ID, entryType: 'proverb', term: 'Ni nyongo ikuthekera rugio',
    meaning: 'It is a pot laughing at the potsherd — nothing lasts for ever, for even a pot will break one day.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T09:20:00Z',
  },
  {
    id: 'lang26', familyId: FAMILY_ID, entryType: 'proverb', term: 'Ni utheri kwinira uri na mpara',
    meaning: 'It is no use to lull a child with a hungry look.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-18T09:25:00Z',
  },
  {
    id: 'lang27', familyId: FAMILY_ID, entryType: 'proverb', term: "Ng'ombe ni cietu kuuma kaumo",
    meaning: 'The cattle belong to us right from the beginning.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T09:30:00Z',
  },
  {
    id: 'lang28', familyId: FAMILY_ID, entryType: 'proverb', term: 'Nja iri mukuru itiguujaga nderi',
    meaning: 'The vultures would not land at a village where there is a wise old man — meaning no crime would be committed, since vultures usually alight where blood has been shed.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T09:35:00Z',
  },
  {
    id: 'lang29', familyId: FAMILY_ID, entryType: 'proverb', term: "Nkejira ng'ombe ntigiri ciuma ngoji",
    meaning: 'I shall come for the cows after the donkeys have grown horns — when pigs fly.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-18T09:40:00Z',
  },
  {
    id: 'lang30', familyId: FAMILY_ID, entryType: 'proverb', term: "Nthenge inkuru ititiyaga utheri",
    meaning: 'An old he-goat does not sneeze for nothing — old men speak the truth with a lot of experience and deep reasoning.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-18T09:45:00Z',
  },
  {
    id: 'lang31', familyId: FAMILY_ID, entryType: 'proverb', term: 'Niku kurita mbiti irinyene',
    meaning: 'It\u2019s like removing a hyena from a pit. A man pulled a trapped hyena out of a pit out of pity, only for the hyena to then demand an arm or leg to eat since it was starving. The man tricked it into stepping onto its back to reach a "fattest arm" supposedly nearby, then climbed out and left it behind. Directed at people who are never grateful for good deeds done for them.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-18T09:50:00Z',
  },
  {
    id: 'lang32', familyId: FAMILY_ID, entryType: 'word', term: 'Muuga',
    meaning: 'Hello / how are you',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:00:00Z',
  },
  {
    id: 'lang33', familyId: FAMILY_ID, entryType: 'word', term: 'Mwari',
    meaning: 'Girl / daughter',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:01:00Z',
  },
  {
    id: 'lang34', familyId: FAMILY_ID, entryType: 'word', term: 'Muji',
    meaning: 'Home',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:02:00Z',
  },
  {
    id: 'lang35', familyId: FAMILY_ID, entryType: 'word', term: 'Ruuji',
    meaning: 'Water',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:03:00Z',
  },
  {
    id: 'lang36', familyId: FAMILY_ID, entryType: 'word', term: 'Naarua / Umunthi',
    meaning: 'Today',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:04:00Z',
  },
  {
    id: 'lang37', familyId: FAMILY_ID, entryType: 'word', term: 'Ruju',
    meaning: 'Tomorrow',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:05:00Z',
  },
  {
    id: 'lang38', familyId: FAMILY_ID, entryType: 'word', term: 'Thimu',
    meaning: 'Phone',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:06:00Z',
  },
  {
    id: 'lang39', familyId: FAMILY_ID, entryType: 'word', term: 'Mucore',
    meaning: 'Friend',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:07:00Z',
  },
  {
    id: 'lang40', familyId: FAMILY_ID, entryType: 'word', term: 'Uka / Nju',
    meaning: 'Come here',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:08:00Z',
  },
  {
    id: 'lang41', familyId: FAMILY_ID, entryType: 'word', term: 'Ndaka',
    meaning: 'Boy',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:09:00Z',
  },
  {
    id: 'lang42', familyId: FAMILY_ID, entryType: 'word', term: 'Muthaka',
    meaning: 'Circumcised boy',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:10:00Z',
  },
  {
    id: 'lang43', familyId: FAMILY_ID, entryType: 'word', term: 'Nja',
    meaning: 'Outside',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:11:00Z',
  },
  {
    id: 'lang44', familyId: FAMILY_ID, entryType: 'word', term: 'Juju',
    meaning: 'Grandparent',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:12:00Z',
  },
  {
    id: 'lang45', familyId: FAMILY_ID, entryType: 'word', term: 'Baaba',
    meaning: 'Father',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:13:00Z',
  },
  {
    id: 'lang46', familyId: FAMILY_ID, entryType: 'word', term: 'Bwatinda atia',
    meaning: 'How was your day',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:14:00Z',
  },
  {
    id: 'lang47', familyId: FAMILY_ID, entryType: 'word', term: 'Tinda bwega',
    meaning: 'Good day',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:15:00Z',
  },
  {
    id: 'lang48', familyId: FAMILY_ID, entryType: 'word', term: 'Butharimwe',
    meaning: 'Be blessed',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:16:00Z',
  },
  {
    id: 'lang49', familyId: FAMILY_ID, entryType: 'word', term: 'Mama wega / Lala bwega',
    meaning: 'Sleep well',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:17:00Z',
  },
  {
    id: 'lang50', familyId: FAMILY_ID, entryType: 'word', term: 'Ii',
    meaning: 'Yes',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:18:00Z',
  },
  {
    id: 'lang51', familyId: FAMILY_ID, entryType: 'word', term: 'Ari',
    meaning: 'No',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:19:00Z',
  },
  {
    id: 'lang52', familyId: FAMILY_ID, entryType: 'word', term: 'Ibwega',
    meaning: 'Thank you',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:20:00Z',
  },
  {
    id: 'lang53', familyId: FAMILY_ID, entryType: 'word', term: 'Twete / Tuthi',
    meaning: "Let's go",
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:21:00Z',
  },
  {
    id: 'lang54', familyId: FAMILY_ID, entryType: 'word', term: 'Twonane',
    meaning: 'See you',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:22:00Z',
  },
  {
    id: 'lang55', familyId: FAMILY_ID, entryType: 'word', term: 'Mbeca',
    meaning: 'Money',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:23:00Z',
  },
  {
    id: 'lang56', familyId: FAMILY_ID, entryType: 'word', term: 'Muno',
    meaning: 'More',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:24:00Z',
  },
  {
    id: 'lang57', familyId: FAMILY_ID, entryType: 'word', term: 'Atia',
    meaning: 'How',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:25:00Z',
  },
  {
    id: 'lang58', familyId: FAMILY_ID, entryType: 'word', term: 'Ntina mbeca',
    meaning: 'I have no money',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:26:00Z',
  },
  {
    id: 'lang59', familyId: FAMILY_ID, entryType: 'word', term: 'Murimi',
    meaning: 'Farmer',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:27:00Z',
  },
  {
    id: 'lang60', familyId: FAMILY_ID, entryType: 'word', term: 'Murui',
    meaning: 'Cook',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:28:00Z',
  },
  {
    id: 'lang61', familyId: FAMILY_ID, entryType: 'word', term: 'Mwiti',
    meaning: 'Traveller',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:29:00Z',
  },
  {
    id: 'lang62', familyId: FAMILY_ID, entryType: 'word', term: 'Mukoobi',
    meaning: 'Borrower',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:30:00Z',
  },
  {
    id: 'lang63', familyId: FAMILY_ID, entryType: 'word', term: 'Mpeempe',
    meaning: 'Maize',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:31:00Z',
  },
  {
    id: 'lang64', familyId: FAMILY_ID, entryType: 'word', term: 'Bangi',
    meaning: 'Others (referring to people)',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:32:00Z',
  },
  {
    id: 'lang65', familyId: FAMILY_ID, entryType: 'word', term: 'Muntu',
    meaning: 'Man',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:33:00Z',
  },
  {
    id: 'lang66', familyId: FAMILY_ID, entryType: 'word', term: 'Muka',
    meaning: 'Woman',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:34:00Z',
  },
  {
    id: 'lang67', familyId: FAMILY_ID, entryType: 'word', term: 'Thaambia',
    meaning: 'Wash',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:35:00Z',
  },
  {
    id: 'lang68', familyId: FAMILY_ID, entryType: 'word', term: 'Cukuru',
    meaning: 'School',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:36:00Z',
  },
  {
    id: 'lang69', familyId: FAMILY_ID, entryType: 'word', term: 'Nkoro',
    meaning: 'Heart',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:37:00Z',
  },
  {
    id: 'lang70', familyId: FAMILY_ID, entryType: 'word', term: 'Njuri',
    meaning: 'Council of elders',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:38:00Z',
  },
  {
    id: 'lang71', familyId: FAMILY_ID, entryType: 'word', term: 'Giti',
    meaning: 'Chair',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:39:00Z',
  },
  {
    id: 'lang72', familyId: FAMILY_ID, entryType: 'word', term: 'Kabeti',
    meaning: 'Small wallet / purse',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:40:00Z',
  },
  {
    id: 'lang73', familyId: FAMILY_ID, entryType: 'word', term: 'Mwiji',
    meaning: 'Boy',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:41:00Z',
  },
  {
    id: 'lang74', familyId: FAMILY_ID, entryType: 'word', term: 'Ucuru',
    meaning: 'Porridge',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:42:00Z',
  },
  {
    id: 'lang75', familyId: FAMILY_ID, entryType: 'word', term: 'Nda',
    meaning: 'Stomach',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:43:00Z',
  },
  {
    id: 'lang76', familyId: FAMILY_ID, entryType: 'word', term: 'Gitanda',
    meaning: 'Bed',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:44:00Z',
  },
  {
    id: 'lang77', familyId: FAMILY_ID, entryType: 'word', term: 'Chai',
    meaning: 'Tea',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:45:00Z',
  },
  {
    id: 'lang78', familyId: FAMILY_ID, entryType: 'word', term: 'Kauwa',
    meaning: 'Coffee',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:46:00Z',
  },
  {
    id: 'lang79', familyId: FAMILY_ID, entryType: 'word', term: 'Chukari',
    meaning: 'Sugar',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:47:00Z',
  },
  {
    id: 'lang80', familyId: FAMILY_ID, entryType: 'word', term: 'Mugate',
    meaning: 'Bread',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:48:00Z',
  },
  {
    id: 'lang81', familyId: FAMILY_ID, entryType: 'word', term: 'Ngari',
    meaning: 'Car',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:49:00Z',
  },
  {
    id: 'lang82', familyId: FAMILY_ID, entryType: 'word', term: 'Irinda',
    meaning: 'Dress',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:50:00Z',
  },
  {
    id: 'lang83', familyId: FAMILY_ID, entryType: 'word', term: 'Shati',
    meaning: 'Shirt',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:51:00Z',
  },
  {
    id: 'lang84', familyId: FAMILY_ID, entryType: 'word', term: 'Kiratu',
    meaning: 'Shoe',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:52:00Z',
  },
  {
    id: 'lang85', familyId: FAMILY_ID, entryType: 'word', term: 'Ng\'ombe',
    meaning: 'Cow',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:53:00Z',
  },
  {
    id: 'lang86', familyId: FAMILY_ID, entryType: 'word', term: 'Mburi',
    meaning: 'Goat',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:54:00Z',
  },
  {
    id: 'lang87', familyId: FAMILY_ID, entryType: 'word', term: 'Ngondu',
    meaning: 'Sheep',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:55:00Z',
  },
  {
    id: 'lang88', familyId: FAMILY_ID, entryType: 'word', term: 'Nguku',
    meaning: 'Hen',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:56:00Z',
  },
  {
    id: 'lang89', familyId: FAMILY_ID, entryType: 'word', term: 'Iria',
    meaning: 'Milk',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T10:57:00Z',
  },
  {
    id: 'lang90', familyId: FAMILY_ID, entryType: 'word', term: 'Yuku / Mbuku',
    meaning: 'Book',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T10:58:00Z',
  },
  {
    id: 'lang91', familyId: FAMILY_ID, entryType: 'word', term: 'Karamu',
    meaning: 'Pencil / pen',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T10:59:00Z',
  },
  {
    id: 'lang92', familyId: FAMILY_ID, entryType: 'word', term: 'Nduka',
    meaning: 'Shop',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:00:00Z',
  },
  {
    id: 'lang93', familyId: FAMILY_ID, entryType: 'word', term: 'Mugunda',
    meaning: 'Farm',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:01:00Z',
  },
  {
    id: 'lang94', familyId: FAMILY_ID, entryType: 'word', term: 'Mwanki',
    meaning: 'Fire / hot',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:02:00Z',
  },
  {
    id: 'lang95', familyId: FAMILY_ID, entryType: 'word', term: 'Mpio',
    meaning: 'Cold',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:03:00Z',
  },
  {
    id: 'lang96', familyId: FAMILY_ID, entryType: 'word', term: 'Riua',
    meaning: 'Sun',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:04:00Z',
  },
  {
    id: 'lang97', familyId: FAMILY_ID, entryType: 'word', term: 'Mweri',
    meaning: 'Moon',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:05:00Z',
  },
  {
    id: 'lang98', familyId: FAMILY_ID, entryType: 'word', term: 'Mbura',
    meaning: 'Rain',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:06:00Z',
  },
  {
    id: 'lang99', familyId: FAMILY_ID, entryType: 'word', term: 'Ruo',
    meaning: 'Rain',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:07:00Z',
  },
  {
    id: 'lang100', familyId: FAMILY_ID, entryType: 'word', term: 'Ina',
    meaning: 'Sing',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:08:00Z',
  },
  {
    id: 'lang101', familyId: FAMILY_ID, entryType: 'word', term: 'Murungu',
    meaning: 'God',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:09:00Z',
  },
  {
    id: 'lang102', familyId: FAMILY_ID, entryType: 'word', term: 'Kanisa',
    meaning: 'Church',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:10:00Z',
  },
  {
    id: 'lang103', familyId: FAMILY_ID, entryType: 'word', term: 'Vatiri',
    meaning: 'Priest',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:11:00Z',
  },
  {
    id: 'lang104', familyId: FAMILY_ID, entryType: 'word', term: 'Mubea',
    meaning: 'Pastor',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:12:00Z',
  },
  {
    id: 'lang105', familyId: FAMILY_ID, entryType: 'word', term: 'Mwana',
    meaning: 'Baby',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:13:00Z',
  },
  {
    id: 'lang106', familyId: FAMILY_ID, entryType: 'word', term: 'Mutanongina',
    meaning: 'Brother',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:14:00Z',
  },
  {
    id: 'lang107', familyId: FAMILY_ID, entryType: 'word', term: 'Mwarongina',
    meaning: 'Sister',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:15:00Z',
  },
  {
    id: 'lang108', familyId: FAMILY_ID, entryType: 'word', term: 'Kameme',
    meaning: 'Radio',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:16:00Z',
  },
  {
    id: 'lang109', familyId: FAMILY_ID, entryType: 'word', term: 'Mwarimu',
    meaning: 'Teacher',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:17:00Z',
  },
  {
    id: 'lang110', familyId: FAMILY_ID, entryType: 'word', term: 'Ndaktari',
    meaning: 'Doctor',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:18:00Z',
  },
  {
    id: 'lang111', familyId: FAMILY_ID, entryType: 'word', term: 'Kuru / Nkui',
    meaning: 'Dog',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:19:00Z',
  },
  {
    id: 'lang112', familyId: FAMILY_ID, entryType: 'word', term: 'Mpaka',
    meaning: 'Cat',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:20:00Z',
  },
  {
    id: 'lang113', familyId: FAMILY_ID, entryType: 'word', term: 'Kiegeri',
    meaning: 'Broom',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:21:00Z',
  },
  {
    id: 'lang114', familyId: FAMILY_ID, entryType: 'word', term: 'Thani',
    meaning: 'Plate',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:22:00Z',
  },
  {
    id: 'lang115', familyId: FAMILY_ID, entryType: 'word', term: 'Gikombe',
    meaning: 'Cup',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:23:00Z',
  },
  {
    id: 'lang116', familyId: FAMILY_ID, entryType: 'word', term: 'Gichiko',
    meaning: 'Spoon',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:24:00Z',
  },
  {
    id: 'lang117', familyId: FAMILY_ID, entryType: 'word', term: 'Gachiu / Kayu',
    meaning: 'Knife',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:25:00Z',
  },
  {
    id: 'lang118', familyId: FAMILY_ID, entryType: 'word', term: 'Uma',
    meaning: 'Fork',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:26:00Z',
  },
  {
    id: 'lang119', familyId: FAMILY_ID, entryType: 'word', term: 'Meno',
    meaning: 'Tooth / teeth',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:27:00Z',
  },
  {
    id: 'lang120', familyId: FAMILY_ID, entryType: 'word', term: 'Kanyua',
    meaning: 'Mouth',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:28:00Z',
  },
  {
    id: 'lang121', familyId: FAMILY_ID, entryType: 'word', term: 'Njara',
    meaning: 'Hand',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:29:00Z',
  },
  {
    id: 'lang122', familyId: FAMILY_ID, entryType: 'word', term: 'Kuguru',
    meaning: 'Foot',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:30:00Z',
  },
  {
    id: 'lang123', familyId: FAMILY_ID, entryType: 'word', term: 'Kiara',
    meaning: 'Toe',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:31:00Z',
  },
  {
    id: 'lang124', familyId: FAMILY_ID, entryType: 'word', term: 'Thibitari',
    meaning: 'Hospital',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:32:00Z',
  },
  {
    id: 'lang125', familyId: FAMILY_ID, entryType: 'word', term: 'Ikwa',
    meaning: 'Yams',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:33:00Z',
  },
  {
    id: 'lang126', familyId: FAMILY_ID, entryType: 'word', term: 'Mulango',
    meaning: 'Door',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:34:00Z',
  },
  {
    id: 'lang127', familyId: FAMILY_ID, entryType: 'word', term: 'Ndigu',
    meaning: 'Bananas',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:35:00Z',
  },
  {
    id: 'lang128', familyId: FAMILY_ID, entryType: 'word', term: 'Kuanda',
    meaning: 'To plant',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-09-11T11:36:00Z',
  },
  {
    id: 'lang129', familyId: FAMILY_ID, entryType: 'word', term: 'Kuandika',
    meaning: 'To write',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-09-11T11:37:00Z',
  },
  {
    id: 'lang130', familyId: FAMILY_ID, entryType: 'word', term: 'Kuthoma',
    meaning: 'To read',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-09-11T11:38:00Z',
  },
];

export const profiles: Profile[] = [
  { id: 'prof1', familyId: FAMILY_ID, memberId: 'm9', displayName: 'John Kobia', email: 'john@example.com', role: 'super_admin' },
  { id: 'prof2', familyId: FAMILY_ID, memberId: 'm11', displayName: 'Catherine Kobia', email: 'catherine@example.com', role: 'family_admin' },
  { id: 'prof3', familyId: FAMILY_ID, memberId: 'm14', displayName: 'Faith Muthomi', email: 'faith@example.com', role: 'family_member' },
  { id: 'prof4', familyId: FAMILY_ID, displayName: 'Guest Viewer', email: 'guest@example.com', role: 'guest' },
];

export const triviaScores: TriviaScore[] = [
  { id: 'triv1', familyId: FAMILY_ID, profileId: 'prof2', playerName: 'Catherine Kobia', category: 'our_family', score: 8, totalQuestions: 10, createdAt: '2026-05-20T10:00:00Z' },
  { id: 'triv2', familyId: FAMILY_ID, profileId: 'prof1', playerName: 'John Kobia', category: 'our_family', score: 7, totalQuestions: 10, createdAt: '2026-05-21T09:00:00Z' },
  { id: 'triv3', familyId: FAMILY_ID, profileId: 'prof3', playerName: 'Faith Muthomi', category: 'history', score: 6, totalQuestions: 10, createdAt: '2026-05-22T14:00:00Z' },
];

export function buildSeedDataset(): FamilyDataset {
  return {
    family: {
      id: FAMILY_ID,
      name: 'The Kobia & Kiogora Family',
      motto: 'Our Roots, Our Story, Our Legacy.',
      originStory: 'Founded in 1950 when Reuben Kobia married Naomi Kiogora and cleared the first coffee terraces above Nkubu, on the eastern slopes of Mount Kenya.',
      activeTreeTemplate: 'classic',
    },
    members,
    relationships,
    albums,
    photos,
    cookbookAlbums,
    recipes,
    memories,
    events,
    announcements,
    chronicleEras,
    biographies,
    legacyContributions,
    languageEntries,
    triviaScores,
    gameScores: [],
    stories: [],
    profiles,
    invitationCodes: [],
    restorationCodes: [],
    notifications: [],
    auditLog: [
      { id: 'au1', familyId: FAMILY_ID, actorName: 'John Kobia', action: 'Added member "Amani Omondi"', entityType: 'member', createdAt: '2026-05-27' },
      { id: 'au2', familyId: FAMILY_ID, actorName: 'Faith Muthomi', action: 'Added memory "Grandmother\'s Wedding Day"', entityType: 'memory', createdAt: '2026-01-10' },
      { id: 'au3', familyId: FAMILY_ID, actorName: 'Catherine Kobia', action: 'Posted announcement "Homestead Land Documents Needed"', entityType: 'announcement', createdAt: '2026-08-20' },
    ],
  };
}
