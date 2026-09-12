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
  ...spouse('m1', 'm2', '1950-06-10'),
  ...spouse('m3', 'm4', '1976-08-14'),
  ...spouse('m5', 'm6', '1977-03-19'),
  ...spouse('m7', 'm8', '1982-10-02'),
  ...spouse('m9', 'm10', '2003-07-12'),
  ...spouse('m11', 'm12', '2007-05-26'),
  ...spouse('m15', 'm16', '2009-12-05'),

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
];

export const albums: Album[] = [
  { id: 'al1', familyId: FAMILY_ID, title: "Naomi & Reuben's Wedding", category: 'weddings',
    description: 'The wedding that started it all, Nkubu 1950.', coverPhotoUrl: 'https://images.unsplash.com/photo-1608009232260-9b527a5bb9bd?w=800' },
  { id: 'al2', familyId: FAMILY_ID, title: '2019 Kobia-Kiogora Reunion', category: 'reunions',
    description: 'Three generations gathered at the Nkubu homestead.', coverPhotoUrl: '/photos/framed_wood_reunion_large.jpg' },
  { id: 'al3', familyId: FAMILY_ID, title: 'Childhood in Nkubu', category: 'childhood',
    description: 'Peter, Susan and James growing up on the farm.', coverPhotoUrl: '/photos/scene_mother_daughter_garden.jpg' },
  { id: 'al4', familyId: FAMILY_ID, title: 'The Homestead, 1955–1970', category: 'historical',
    description: 'Early photographs of the coffee terraces and original house.', coverPhotoUrl: '/photos/scene_grandmas_garden.jpg' },
  { id: 'al5', familyId: FAMILY_ID, title: "Remembering Reuben & Naomi", category: 'memorials',
    description: 'A tribute album shared at both memorial services.', coverPhotoUrl: '/photos/framed_wood_elders.jpg' },
  { id: 'al6', familyId: FAMILY_ID, title: 'Christmas at the Homestead', category: 'holidays',
    description: 'The annual gathering, every December since 1985.', coverPhotoUrl: '/photos/scene_dinner_selfie.jpg' },
];

export const photos: Photo[] = [
  { id: 'p1', albumId: 'al1', familyId: FAMILY_ID, url: 'https://images.unsplash.com/photo-1608009232260-9b527a5bb9bd?w=800', caption: 'Reuben and Naomi outside church, 1950', takenAt: '1950-06-10', taggedMemberIds: ['m1', 'm2'] },
  { id: 'p2', albumId: 'al2', familyId: FAMILY_ID, url: '/photos/framed_wood_reunion_large.jpg', caption: 'The whole family under the old fig tree', takenAt: '2019-12-27', taggedMemberIds: ['m3','m4','m5','m6','m7','m8'] },
  { id: 'p3', albumId: 'al3', familyId: FAMILY_ID, url: '/photos/scene_kids_garden.jpg', caption: 'Peter and Susan on the farm, 1962', takenAt: '1962-04-01', taggedMemberIds: ['m3','m5'] },
  { id: 'p4', albumId: 'al4', familyId: FAMILY_ID, url: '/photos/scene_grandmas_garden.jpg', caption: 'The original homestead house', takenAt: '1958-01-01', taggedMemberIds: [] },
  { id: 'p5', albumId: 'al6', familyId: FAMILY_ID, url: '/photos/scene_dinner_selfie.jpg', caption: 'Christmas lunch, 2021', takenAt: '2021-12-25', taggedMemberIds: ['m9','m10','m17','m18'] },
];

export const cookbookAlbums: CookbookAlbum[] = [
  { id: 'cb1', familyId: FAMILY_ID, title: '📖 Traditional Family Cookbook', style: 'traditional',
    description: "A warm, heirloom-style book with recipes, food photos, and family-story sections — everything Naomi cooked, and everything her children and grandchildren still make in her memory.",
    coverPhotoUrl: '/photos/scene_kitchen.jpg', featuredMemberId: 'm2' },
];

export const recipes: Recipe[] = [
  // Breakfast
  { id: 'rc1', albumId: 'cb1', familyId: FAMILY_ID, title: 'Naomi\'s Mandazi', category: 'breakfast',
    photoUrl: 'https://images.unsplash.com/photo-1626200926749-93447a3e0d0a?w=800',
    ingredients: ['3 cups all-purpose flour', '1/2 cup sugar', '2 tsp baking powder', '1/2 tsp ground cardamom', '1 cup coconut milk', '2 tbsp melted butter', 'Oil for frying'],
    instructions: ['Whisk the flour, sugar, baking powder, and cardamom together.', 'Stir in the coconut milk and melted butter until a soft dough forms.', 'Knead gently for 5 minutes, then rest covered for 30 minutes.', 'Roll out and cut into triangles.', 'Fry in medium-hot oil until golden on both sides, then drain on paper towels.'],
    familyStory: 'Naomi made these every Sunday before church, frying the first batch while the rest of the house was still asleep. The smell of cardamom drifting down the hallway was how her children knew what day it was.',
    contributedByMemberId: 'm4', createdAt: '2026-02-01T08:00:00Z' },
  { id: 'rc2', albumId: 'cb1', familyId: FAMILY_ID, title: 'Homestead Uji (Fermented Porridge)', category: 'breakfast',
    photoUrl: 'https://images.unsplash.com/photo-1615486364918-fb3b60c1e0dd?w=800',
    ingredients: ['2 cups millet or sorghum flour', '6 cups water', '1/2 cup plain yogurt or leftover uji for fermenting', 'Sugar or honey to taste'],
    instructions: ['Mix the flour with 2 cups of cold water into a smooth paste.', 'Stir in the yogurt, cover, and leave at room temperature for 24 hours to ferment slightly.', 'Bring the remaining water to a boil, then whisk in the fermented paste.', 'Simmer, stirring constantly, for 10 minutes until thickened.', 'Sweeten to taste and serve warm.'],
    familyStory: 'Reuben insisted on uji before any farm work — he used to say a man who skipped it "would be blown off the terraces by lunchtime."',
    contributedByMemberId: 'm3', createdAt: '2026-02-01T08:05:00Z' },

  // Main meals
  { id: 'rc3', albumId: 'cb1', familyId: FAMILY_ID, title: 'Sunday Vegetable Pilau', category: 'main',
    photoUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
    ingredients: ['2 cups basmati rice', '2 carrots, diced', '1 cup green peas', '2 potatoes, cubed', '1 onion, sliced', '3 cups vegetable stock', '1 tbsp pilau masala', '2 cloves, 1 cinnamon stick', 'Salt to taste'],
    instructions: ['Fry the onion in oil until deep golden, then add the cloves, cinnamon, and pilau masala.', 'Add the potatoes and carrots and stir to coat in the spices.', 'Stir in the rice, then pour in the vegetable stock and salt.', 'Bring to a boil, then cover and simmer on low heat for 20 minutes.', 'Fold in the peas for the last 5 minutes and let the pot rest, covered, before serving.'],
    familyStory: 'Every reunion at the homestead ends the same way: James at the stove arguing with Peter about how much cinnamon the pot really needs, while the grandchildren circle waiting for the first plate.',
    contributedByMemberId: 'm7', createdAt: '2026-02-01T08:10:00Z' },
  { id: 'rc4', albumId: 'cb1', familyId: FAMILY_ID, title: 'Naomi\'s Githeri', category: 'main',
    photoUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    ingredients: ['3 cups maize and beans (mixed, soaked overnight)', '1 onion, chopped', '2 tomatoes, chopped', '2 carrots, diced', '1 tsp curry powder', 'Salt to taste'],
    instructions: ['Boil the soaked maize and beans until tender, about 1 hour.', 'In a separate pot, sauté the onion until soft, then add tomatoes and curry powder.', 'Add the carrots and cooked maize-beans mixture with a little of its cooking liquid.', 'Simmer together for 15 minutes and season with salt before serving.'],
    familyStory: 'This was the one dish Naomi could stretch to feed anyone who showed up unannounced — and in Nkubu, someone always did.',
    contributedByMemberId: 'm5', createdAt: '2026-02-01T08:15:00Z' },
  { id: 'rc5', albumId: 'cb1', familyId: FAMILY_ID, title: 'Mukimo (Mashed Greens & Potatoes)', category: 'main',
    photoUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    ingredients: ['1 kg potatoes, peeled and cubed', '2 cups pumpkin leaves or spinach', '1 cup fresh maize kernels', '1 cup green peas', 'Salt to taste'],
    instructions: ['Boil the potatoes and maize together until soft.', 'Add the peas and greens for the last 5 minutes of cooking.', 'Drain, reserving a little cooking water, then mash everything together until well combined.', 'Season with salt and serve alongside stewed meat.'],
    familyStory: 'Alice learned to make this standing on a stool next to Naomi\'s cooking fire, and still mashes it the same way — "by feel, not by time," as Naomi used to say.',
    contributedByMemberId: 'm4', createdAt: '2026-02-01T08:20:00Z' },

  // Snacks
  { id: 'rc6', albumId: 'cb1', familyId: FAMILY_ID, title: 'Roasted Mahindi (Corn) with Chili-Lime', category: 'snacks',
    photoUrl: 'https://images.unsplash.com/photo-1601315379734-3c99f9e39c37?w=800',
    ingredients: ['4 ears fresh corn, husked', 'Juice of 2 limes', '1 tsp chili powder', 'Pinch of salt'],
    instructions: ['Roast the corn directly over hot coals, turning often, until lightly charred all over.', 'Mix the lime juice, chili powder, and salt.', 'Brush the mixture over the hot corn and serve immediately.'],
    familyStory: 'Sold from a cart just outside the Chogoria school gate — Naomi\'s students still say they can\'t smell roasted corn without thinking of her.',
    contributedByMemberId: 'm14', createdAt: '2026-02-01T08:25:00Z' },
  { id: 'rc7', albumId: 'cb1', familyId: FAMILY_ID, title: 'Vegetable Samosas', category: 'snacks',
    photoUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
    ingredients: ['2 potatoes, boiled and mashed', '1 cup green peas', '1 carrot, finely diced', '1 onion, finely chopped', '1 tsp curry powder', '1 tsp garam masala', 'Samosa pastry sheets', 'Oil for frying'],
    instructions: ['Sauté the onion and carrot until soft, then stir in the curry powder and garam masala.', 'Add the mashed potato and peas, mix well, and season with salt.', 'Cool the filling completely before assembling.', 'Fold the pastry into cones, fill, and seal the edges with a flour paste.', 'Deep-fry until golden and crisp, then drain before serving.'],
    familyStory: 'The 2019 reunion ran out of samosas twice — Ruth\'s now-legendary batch has become the thing every cousin asks about before they even arrive.',
    contributedByMemberId: 'm8', createdAt: '2026-02-01T08:30:00Z' },

  // Desserts
  { id: 'rc8', albumId: 'cb1', familyId: FAMILY_ID, title: 'Kaimati (Sweet Dumplings)', category: 'desserts',
    photoUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
    ingredients: ['2 cups flour', '1 tsp yeast', '1/2 cup sugar', '1 cup warm water', 'Oil for frying', '1 cup sugar syrup flavored with cardamom'],
    instructions: ['Mix the flour, yeast, sugar, and warm water into a thick batter; let rise for 1 hour.', 'Drop spoonfuls of batter into hot oil and fry until golden brown and puffed.', 'Drain briefly, then dip immediately into the warm cardamom syrup.', 'Serve warm or at room temperature.'],
    familyStory: 'Reserved for Christmas and big celebrations only — Naomi kept the syrup recipe a closely guarded secret until she finally taught it to Grace the year before she passed.',
    contributedByMemberId: 'm15', createdAt: '2026-02-01T08:35:00Z' },
  { id: 'rc9', albumId: 'cb1', familyId: FAMILY_ID, title: 'Sweet Potato & Coconut Pudding', category: 'desserts',
    photoUrl: 'https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?w=800',
    ingredients: ['1 kg orange sweet potatoes, peeled and grated', '1 cup coconut milk', '1/2 cup sugar', '1/2 tsp ground cinnamon', '2 tbsp butter'],
    instructions: ['Mix the grated sweet potato with the coconut milk, sugar, and cinnamon.', 'Pour into a greased baking dish and dot with butter.', 'Bake at 180°C (350°F) for 45 minutes until set and golden on top.', 'Cool slightly before slicing and serving.'],
    familyStory: 'Naomi grew the sweet potatoes herself on the terrace closest to the house — Susan still plants that same patch every season "so the pudding tastes right."',
    contributedByMemberId: 'm5', createdAt: '2026-02-01T08:40:00Z' },

  // Main meals (vegetarian)
  { id: 'rc10', albumId: 'cb1', familyId: FAMILY_ID, title: 'Sukuma Wiki (Braised Collard Greens)', category: 'main', isVegetarian: true,
    photoUrl: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=800',
    ingredients: ['1 large bunch collard greens or kale, finely shredded', '1 onion, sliced', '2 tomatoes, chopped', '1 green bell pepper, sliced', '2 tbsp cooking oil', 'Salt to taste'],
    instructions: ['Heat the oil and sauté the onion until translucent.', 'Add the tomatoes and bell pepper and cook until softened.', 'Stir in the shredded greens a handful at a time, cooking until wilted.', 'Season with salt and simmer for 5 more minutes before serving alongside ugali or mukimo.'],
    familyStory: 'Naomi grew sukuma along the fence line so there was always a handful within reach — she used to say a homestead without greens by the door "wasn\'t really keeping house."',
    contributedByMemberId: 'm4', createdAt: '2026-02-01T08:45:00Z' },
  { id: 'rc11', albumId: 'cb1', familyId: FAMILY_ID, title: 'Ndengu (Green Gram) Coconut Stew', category: 'main', isVegetarian: true,
    photoUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
    ingredients: ['2 cups green gram (ndengu), soaked overnight', '1 onion, chopped', '2 tomatoes, chopped', '1 cup coconut milk', '1 tsp curry powder', 'Salt to taste'],
    instructions: ['Boil the soaked green gram until tender, about 30–40 minutes, then drain.', 'Sauté the onion until soft, add the tomatoes and curry powder, and cook until it forms a thick base.', 'Stir in the cooked green gram and coconut milk.', 'Simmer for 10 minutes, season with salt, and serve with rice or chapati.'],
    familyStory: 'Catherine\'s go-to dish for Lent, learned over the phone from Alice one bite-by-bite Sunday call — it\'s now the first thing she teaches any cousin who says they "can\'t cook."',
    contributedByMemberId: 'm11', createdAt: '2026-02-01T08:50:00Z' },
];

export const memories: Memory[] = [
  { id: 'mem1', familyId: FAMILY_ID, title: "Grandmother's Wedding Day & The Silk Shawl (1950)",
    body: "Naomi wore her mother's silk shawl, hand-carried from Chogoria, and insisted the ceremony wait until the afternoon rains passed. The shawl is still kept in the cedar chest at the homestead.",
    era: '1950s', authorMemberId: 'm5', coverPhotoUrl: 'https://images.unsplash.com/photo-1608009232260-9b527a5bb9bd?w=800',
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
  { id: 'an3', familyId: FAMILY_ID, title: 'New Photos Added', body: 'The 2021 Christmas photos are now in the gallery — thank you to everyone who shared.', priority: 'normal', postedByMemberId: 'm14', createdAt: '2026-01-10' },
];

export const chronicleEras: ChronicleEra[] = [
  { id: 'ce1', familyId: FAMILY_ID, eraLabel: '1890s — Origins', sortOrder: 1,
    headline: 'The Kobia and Kiogora lineages take root on the slopes of Mount Kenya.',
    narrative: 'Long before Reuben and Naomi, both families farmed neighboring hills near Nkubu, tied together by trade routes and shared harvests.' },
  { id: 'ce2', familyId: FAMILY_ID, eraLabel: '1950s — A Union', sortOrder: 2,
    headline: 'Reuben Kobia marries Naomi Kiogora and founds the homestead.',
    narrative: 'The couple cleared and terraced the land that remains the family\'s anchor point to this day.',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800' },
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
    personalLife: 'Reuben and Naomi married in 1950 and raised five children on the Nkubu homestead. He never used a watch, telling time instead by the shadow of a particular fig tree on the property \u2014 and he was rarely wrong. He also had a habit of pressing a fresh coffee cherry into the hand of any grandchild who visited, saying "taste where you come from." In his later years he handed day-to-day farming over to his sons but walked the terraces every morning until his health no longer allowed it, and kept a running, informal scoreboard of who could climb the fig tree fastest.',
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
    id: 'lang1', familyId: FAMILY_ID, entryType: 'word', term: 'Nyomba',
    meaning: 'House / home — the family homestead in Nkubu that still gathers everyone every December.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'lang2', familyId: FAMILY_ID, entryType: 'word', term: 'Muka',
    meaning: 'Wife.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-02-11T09:30:00Z',
  },
  {
    id: 'lang3', familyId: FAMILY_ID, entryType: 'word', term: 'Kaana',
    meaning: 'Child.',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-02-12T11:00:00Z',
  },
  {
    id: 'lang4', familyId: FAMILY_ID, entryType: 'phrase', term: 'Muga? \u2014 Muga mono.',
    meaning: 'A traditional greeting exchange from the Imenti dialect around Meru town: "Muga?" ("Hello?") is answered with "Muga mono" ("Hello indeed"). Elders still greet visitors arriving at the homestead this way.',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-02-15T14:00:00Z',
  },
  {
    id: 'lang5', familyId: FAMILY_ID, entryType: 'proverb', term: 'G\u0129kund\u0129 k\u0129nene g\u0129tiumaga na m\u0169nd\u0169 \u0169mwe.',
    meaning: 'No big gathering comes from one person alone \u2014 the family only grows strong when everyone contributes. A saying Grandma Naomi liked to repeat at reunions; elders in the family recite it slightly differently depending on which homestead they grew up in.',
    contributedByProfileId: 'prof2', contributedByName: 'Catherine Kobia', createdAt: '2026-03-05T16:20:00Z',
  },
  {
    id: 'lang6', familyId: FAMILY_ID, entryType: 'riddle', term: 'N\u0129 k\u0129\u0129 k\u0129r\u0129 na maithori t\u0169nyinya no g\u0129ti\u0169ragwo?',
    meaning: 'What weeps constantly but is never hurt? Riddles like this were traditionally traded between children in the evenings; the wording has drifted a little over the generations, as oral riddles do.',
    answer: 'Mbura (the rain).',
    contributedByProfileId: 'prof3', contributedByName: 'Faith Muthomi', createdAt: '2026-03-12T18:45:00Z',
  },
  {
    id: 'lang7', familyId: FAMILY_ID, entryType: 'saying', term: '"Taste where you come from."',
    meaning: 'What Grandpa Reuben said every time he pressed a fresh coffee cherry into a grandchild\u2019s hand — his way of tying the family back to the land, no matter how far anyone had moved.',
    saidByMemberId: 'm1',
    contributedByProfileId: 'prof1', contributedByName: 'John Kobia', createdAt: '2026-03-15T09:10:00Z',
  },
  {
    id: 'lang8', familyId: FAMILY_ID, entryType: 'saying', term: '"A visitor never leaves this house hungry."',
    meaning: 'Grandma Naomi\u2019s standing rule for the homestead — she\u2019d start cooking the moment she heard a car on the drive, whether she knew who it was or not.',
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
      coverPhotoUrl: '/photos/scene_farm_gathering.jpg',
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
      { id: 'au2', familyId: FAMILY_ID, actorName: 'Faith Muthomi', action: 'Uploaded 6 photos to "Christmas at the Homestead"', entityType: 'photo', createdAt: '2026-01-10' },
      { id: 'au3', familyId: FAMILY_ID, actorName: 'Catherine Kobia', action: 'Posted announcement "Homestead Land Documents Needed"', entityType: 'announcement', createdAt: '2026-08-20' },
    ],
  };
}
