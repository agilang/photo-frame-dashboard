// Mock data for the prototype. Everything is relative to "today" so the demo always looks current.
window.DATA = (function () {
  var base = new Date();
  base.setHours(0, 0, 0, 0);
  var n = 0;

  var ALL = ['alex', 'jordan', 'casey', 'sam'];

  var people = [
    { id: 'alex', name: 'Alex', color: '#2D5BFF', rgb: '45 91 255', ink: '#FFFFFF', home: false, status: 'Away' },
    { id: 'jordan', name: 'Jordan', color: '#E4007C', rgb: '228 0 124', ink: '#FFFFFF', home: false, status: 'Away' },
    { id: 'casey', name: 'Casey', color: '#00A36C', rgb: '0 163 108', ink: '#FFFFFF', home: true, status: 'Home' },
    { id: 'sam', name: 'Sam', color: '#FFB000', rgb: '255 176 0', ink: '#111111', home: true, status: 'Home' }
  ];
  var family = { id: 'family', name: 'Family', color: '#111111', rgb: '17 17 17', ink: '#FFFFFF' };

  // ---------------------------------------------------------------- calendar
  var events = [];

  // ---------------------------------------------------------------- chores
  var routines = [
    { id: 'morning', name: 'Morning', range: '6 – 11 AM', from: 0, to: 11 },
    { id: 'after', name: 'After school', range: '11 AM – 5 PM', from: 11, to: 17 },
    { id: 'evening', name: 'Evening', range: '5 – 10 PM', from: 17, to: 24 }
  ];
  var cid = 0;
  function chore(r, who, title, emoji, stars, done, extra) {
    return Object.assign({ id: 'c' + (++cid), r: r, who: who, title: title, emoji: emoji, stars: stars, done: !!done }, extra || {});
  }
  var chores = [
    chore('morning', 'casey', 'Make bed', '🛏️', 1, true),
    chore('morning', 'casey', 'Brush teeth', '🪥', 1, true),
    chore('morning', 'casey', 'Pack school bag and water bottle', '🎒', 1, true),
    chore('morning', 'sam', 'Make bed', '🛏️', 1, true),
    chore('morning', 'sam', 'Brush teeth', '🪥', 1, true),
    chore('morning', 'sam', 'Get dressed for school', '👕', 1, false),
    chore('morning', 'alex', 'School drop-off', '🚗', 0, true),
    chore('morning', 'jordan', 'Pack school tiffins', '🍱', 0, true),
    chore('morning', 'any', 'Water the plants', '🪴', 1, false),

    chore('after', 'casey', 'Empty and rinse tiffin box', '🍱', 1, true),
    chore('after', 'casey', 'Homework', '📚', 2, false),
    chore('after', 'casey', 'Put away school bag', '🎒', 1, false),
    chore('after', 'sam', 'Empty and rinse tiffin box', '🍱', 1, true),
    chore('after', 'sam', 'Read for 20 min', '📖', 2, false),
    chore('after', 'sam', 'Practice piano', '🎹', 2, false),
    chore('after', 'sam', 'Practice an instrument', '🎹', 2, false),
    chore('after', 'sam', 'Put away toys', '🧸', 1, false),
    chore('after', 'alex', 'Take out recycling', '♻️', 0, false),
    chore('after', 'alex', 'Check school messages', '📱', 0, true),
    chore('after', 'jordan', 'Fold laundry', '🧺', 0, false),
    chore('after', 'any', 'Rinse and soak dal for dinner', '🥣', 1, false),
    chore('after', 'any', 'Start rice cooker for dinner', '🍚', 1, false),
    chore('after', 'any', 'Water the plants', '🪴', 1, false),

    chore('evening', 'casey', 'Set the table', '🍴', 1, false),
    chore('evening', 'casey', 'Set out school uniform', '👕', 1, false),
    chore('evening', 'casey', 'Shower', '🚿', 1, false),
    chore('evening', 'sam', 'Clear plates and lunch containers', '🍽️', 1, false),
    chore('evening', 'sam', 'Bath', '🛁', 1, false),
    chore('evening', 'sam', 'Set out school uniform', '👕', 1, false),
    chore('evening', 'alex', 'Lock up', '🔐', 0, false),
    chore('evening', 'jordan', 'Wash and dry tiffin boxes', '🫧', 0, false),
    chore('evening', 'any', 'Wipe kitchen counters and stovetop', '🧽', 1, false),
    chore('evening', 'any', 'Take out kitchen rubbish', '🗑️', 1, false)
  ];
  var stars = { casey: 42, sam: 57 };
  // Mon..Sun, 1 = all chores done, 0 = missed, null = future
  var week = { casey: [1, 1, 0, 1, 1, 0, 1], sam: [1, 0, 1, 1, 1, 1, 0] };

  // ---------------------------------------------------------------- shopping
  var stores = [{ id: 'grocer', name: 'Indian Grocery' }, { id: 'costco', name: 'Costco' }];
  var catOrder = {
    all: ['Produce', 'Dairy & Refrigerated', 'Grains & Lentils', 'Protein & Meat', 'Spices & Pantry', 'Bakery & Breakfast', 'Frozen', 'Snacks', 'Household'],
    grocer: ['Produce', 'Dairy & Refrigerated', 'Grains & Lentils', 'Protein & Meat', 'Spices & Pantry', 'Bakery & Breakfast', 'Frozen', 'Snacks', 'Household'],
    costco: ['Household', 'Snacks', 'Dairy & Refrigerated', 'Protein & Meat', 'Grains & Lentils', 'Produce', 'Bakery & Breakfast', 'Frozen', 'Spices & Pantry']
  };
  var gid = 0;
  function g(name, cat, qty, store, done, note) {
    return { id: 'g' + (++gid), name: name, cat: cat, qty: qty, store: store, done: !!done, note: note || '' };
  }
  var groceries = [
    g('Bananas', 'Produce', 1, 'grocer'),
    g('Onions', 'Produce', 2, 'grocer'),
    g('Tomatoes', 'Produce', 1, 'grocer'),
    g('Cilantro', 'Produce', 2, 'grocer'),
    g('Curry leaves', 'Produce', 1, 'grocer'),
    g('Green chillies', 'Produce', 1, 'grocer'),
    g('Ginger', 'Produce', 1, 'grocer'),
    g('Plain yogurt / curd', 'Dairy & Refrigerated', 1, 'grocer'),
    g('Paneer', 'Dairy & Refrigerated', 1, 'grocer'),
    g('Milk', 'Dairy & Refrigerated', 1, 'costco'),
    g('Dosa / idli batter', 'Dairy & Refrigerated', 1, 'grocer'),
    g('Basmati rice', 'Grains & Lentils', 1, 'grocer'),
    g('Toor dal', 'Grains & Lentils', 1, 'grocer'),
    g('Whole wheat atta', 'Grains & Lentils', 1, 'grocer'),
    g('Eggs', 'Protein & Meat', 1, 'costco'),
    g('Chicken thighs', 'Protein & Meat', 1, 'grocer', false, 'Optional'),
    g('Cumin seeds', 'Spices & Pantry', 1, 'grocer'),
    g('Turmeric powder', 'Spices & Pantry', 1, 'grocer'),
    g('Mustard seeds', 'Spices & Pantry', 1, 'grocer'),
    g('Garam masala', 'Spices & Pantry', 1, 'grocer'),
    g('Ghee', 'Spices & Pantry', 1, 'grocer'),
    g('Tea', 'Spices & Pantry', 1, 'costco'),
    g('Frozen peas', 'Frozen', 1, 'grocer'),
    g('Roasted makhana', 'Snacks', 1, 'grocer'),
    g('Mixed nuts', 'Snacks', 1, 'costco'),
    g('Tiffin liners / snack bags', 'Household', 1, 'costco'),
    g('Dish soap', 'Household', 1, 'grocer')
  ];
  var catalog = [
    ['Apples', 'Produce'], ['Avocados', 'Produce'], ['Bananas', 'Produce'], ['Beans', 'Produce'], ['Bell peppers', 'Produce'],
    ['Bitter gourd', 'Produce'], ['Bottle gourd', 'Produce'], ['Broccoli', 'Produce'], ['Cabbage', 'Produce'], ['Carrots', 'Produce'],
    ['Cauliflower', 'Produce'], ['Cilantro', 'Produce'], ['Cucumbers', 'Produce'], ['Curry leaves', 'Produce'], ['Eggplant', 'Produce'],
    ['Garlic', 'Produce'], ['Ginger', 'Produce'], ['Green chillies', 'Produce'], ['Lemons', 'Produce'], ['Limes', 'Produce'],
    ['Mangoes', 'Produce'], ['Okra', 'Produce'], ['Onions', 'Produce'], ['Potatoes', 'Produce'], ['Spinach', 'Produce'],
    ['Sweet potatoes', 'Produce'], ['Tomatoes', 'Produce'], ['Plain yogurt / curd', 'Dairy & Refrigerated'], ['Paneer', 'Dairy & Refrigerated'],
    ['Milk', 'Dairy & Refrigerated'], ['Eggs', 'Protein & Meat'], ['Dosa / idli batter', 'Dairy & Refrigerated'],
    ['Coconut milk', 'Dairy & Refrigerated'], ['Butter', 'Dairy & Refrigerated'], ['Basmati rice', 'Grains & Lentils'],
    ['Sona masoori rice', 'Grains & Lentils'], ['Whole wheat atta', 'Grains & Lentils'], ['Toor dal', 'Grains & Lentils'],
    ['Moong dal', 'Grains & Lentils'], ['Masoor dal', 'Grains & Lentils'], ['Chana dal', 'Grains & Lentils'],
    ['Chickpeas', 'Grains & Lentils'], ['Poha', 'Grains & Lentils'], ['Semolina / rava', 'Grains & Lentils'],
    ['Chicken breasts', 'Protein & Meat'], ['Chicken thighs', 'Protein & Meat'], ['Ground meat', 'Protein & Meat'],
    ['Fish', 'Protein & Meat'], ['Cumin seeds', 'Spices & Pantry'], ['Mustard seeds', 'Spices & Pantry'],
    ['Turmeric powder', 'Spices & Pantry'], ['Garam masala', 'Spices & Pantry'], ['Chilli powder', 'Spices & Pantry'],
    ['Coriander powder', 'Spices & Pantry'], ['Sambar powder', 'Spices & Pantry'], ['Rasam powder', 'Spices & Pantry'],
    ['Ghee', 'Spices & Pantry'], ['Tamarind', 'Spices & Pantry'], ['Jaggery', 'Spices & Pantry'],
    ['Tea', 'Spices & Pantry'], ['Coffee', 'Spices & Pantry'], ['Bread', 'Bakery & Breakfast'], ['Oats', 'Bakery & Breakfast'],
    ['Frozen peas', 'Frozen'], ['Frozen parathas', 'Frozen'], ['Roasted makhana', 'Snacks'], ['Mixture / namkeen', 'Snacks'],
    ['Mixed nuts', 'Snacks'], ['Dish soap', 'Household'], ['Laundry detergent', 'Household'],
    ['Garbage bags', 'Household'], ['Tiffin liners / snack bags', 'Household'], ['Toothpaste', 'Household']
  ];
  var usuals = ['Onions', 'Tomatoes', 'Cilantro', 'Curry leaves', 'Plain yogurt / curd', 'Paneer', 'Basmati rice', 'Toor dal', 'Whole wheat atta', 'Dosa / idli batter', 'Ghee', 'Tea'];

  // ---------------------------------------------------------------- home control
  var rooms = [
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'living', name: 'Living Room' },
    { id: 'entry', name: 'Entry + Garage' },
    { id: 'upstairs', name: 'Upstairs' },
    { id: 'yard', name: 'Backyard' }
  ];
  var devices = [
    { id: 'k-pend', room: 'kitchen', type: 'light', name: 'Pendants', on: true, level: 80 },
    { id: 'k-under', room: 'kitchen', type: 'light', name: 'Under Cabinet', on: true, level: 55 },
    { id: 'k-island', room: 'kitchen', type: 'light', name: 'Island', on: false, level: 100 },
    { id: 'k-speaker', room: 'kitchen', type: 'blind', name: 'Window Shade', pos: 100 },
    { id: 'l-lamp', room: 'living', type: 'light', name: 'Floor Lamp', on: true, level: 45 },
    { id: 'l-ceil', room: 'living', type: 'light', name: 'Ceiling', on: false, level: 100 },
    { id: 'l-blinds', room: 'living', type: 'blind', name: 'Blinds', pos: 60 },
    { id: 'l-fire', room: 'living', type: 'light', name: 'Mantel', on: false, level: 70 },
    { id: 'e-door', room: 'entry', type: 'lock', name: 'Front Door', locked: true },
    { id: 'e-porch', room: 'entry', type: 'light', name: 'Porch', on: true, level: 100 },
    { id: 'g-door', room: 'entry', type: 'garage', name: 'Garage', state: 'closed' },
    { id: 'g-side', room: 'entry', type: 'lock', name: 'Side Door', locked: true },
    { id: 'u-casey', room: 'upstairs', type: 'light', name: "Casey's Lamp", on: true, level: 30 },
    { id: 'u-sam', room: 'upstairs', type: 'light', name: "Sam's Nightlight", on: false, level: 15 },
    { id: 'u-hall', room: 'upstairs', type: 'light', name: 'Hallway', on: false, level: 60 },
    { id: 'u-bath', room: 'upstairs', type: 'light', name: 'Bathroom', on: false, level: 100 },
    { id: 'y-string', room: 'yard', type: 'light', name: 'String Lights', on: false, level: 100, flaky: true },
    { id: 'y-back', room: 'yard', type: 'lock', name: 'Back Door', locked: true },
    { id: 'y-flood', room: 'yard', type: 'light', name: 'Floodlight', on: false, level: 100 }
  ];
  var climate = { current: 20.5, set: 21.5, mode: 'heat', humidity: 42, outside: 14 };
  var media = { room: 'Kitchen', title: 'Harvest Moon', artist: 'Neil Young', playing: true, volume: 35, seed: 'harvest-vinyl' };
  var cameras = [
    { id: 'c-front', name: 'Front Porch', seed: '59' },
    { id: 'c-drive', name: 'Driveway', seed: '17' },
    { id: 'c-yard', name: 'Backyard', seed: '92' }
  ];
  var scenes = [
    { id: 'morning', name: 'Morning', icon: 'sunrise', set: { 'k-pend': 100, 'k-under': 80, 'l-blinds': 100, 'l-lamp': 0, 'u-hall': 60 } },
    { id: 'dinner', name: 'Dinner', icon: 'utensils', set: { 'k-pend': 55, 'k-under': 30, 'k-island': 70, 'l-lamp': 40, 'l-ceil': 0 } },
    { id: 'movie', name: 'Movie', icon: 'film', set: { 'k-pend': 0, 'k-under': 15, 'k-island': 0, 'l-lamp': 15, 'l-ceil': 0, 'l-blinds': 0, 'l-fire': 30 } },
    { id: 'away', name: 'Away', icon: 'away', set: { 'k-pend': 0, 'k-under': 0, 'k-island': 0, 'l-lamp': 0, 'l-ceil': 0, 'l-fire': 0, 'u-casey': 0, 'u-hall': 0, 'e-porch': 100 } },
    { id: 'night', name: 'Goodnight', icon: 'moon', set: { 'k-pend': 0, 'k-under': 10, 'k-island': 0, 'l-lamp': 0, 'l-ceil': 0, 'l-fire': 0, 'u-hall': 10, 'u-sam': 15, 'e-porch': 0 } }
  ];

  // ---------------------------------------------------------------- weather (index = hour of day)
  var weather = {
    location: 'Austin, TX 78701', latitude: 30.2672, longitude: -97.7431, timezone: 'America/Chicago', hi: 17, lo: 8, feels: -2, humidity: 71, wind: 18,
    days: [
      { offset: 0, hi: 17, lo: 8, c: 'partly', p: 10 },
      { offset: 1, hi: 18, lo: 7, c: 'sun', p: 0 },
      { offset: 2, hi: 16, lo: 9, c: 'cloud', p: 15 },
      { offset: 3, hi: 14, lo: 8, c: 'rain', p: 70 },
      { offset: 4, hi: 15, lo: 7, c: 'partly', p: 10 },
      { offset: 5, hi: 19, lo: 9, c: 'sun', p: 0 },
      { offset: 6, hi: 18, lo: 10, c: 'cloud', p: 20 }
    ],
    t: [9, 9, 8, 8, 8, 8, 9, 10, 11, 12, 13, 15, 16, 17, 16, 15, 14, 13, 12, 12, 11, 10, 10, 9],
    c: ['moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'partly', 'partly', 'sun', 'sun', 'sun', 'partly', 'partly', 'cloud', 'cloud', 'cloud', 'rain', 'rain', 'rain', 'rain', 'cloud', 'cloud', 'moon', 'moon'],
    p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 10, 20, 25, 40, 80, 90, 70, 55, 20, 10, 0, 0]
  };

  // ---------------------------------------------------------------- photos
  var t = new Date(base);
  var mmdd = ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  var photos = [
    { seed: '29', o: 'l', date: '2019-' + mmdd, place: 'Banff, AB', from: 'alex', tag: 'banff' },
    { seed: '16', o: 'l', date: '2021-' + mmdd, place: 'Tofino, BC', from: 'jordan', tag: 'tofino' },
    { seed: '11', o: 'l', date: '2023-08-12', place: 'Lake of Bays', from: 'alex', tag: 'cottage' },
    { seed: '15', o: 'p', date: '2020-09-26', place: 'Algonquin', from: 'alex', tag: 'algonquin' },
    { seed: '17', o: 'p', date: '2022-10-09', place: 'High Park', from: 'alex', tag: 'fall22' },
    { seed: '58', o: 'p', date: '2024-08-04', place: 'Peggys Cove, NS', from: 'alex', tag: 'ns' },
    { seed: '54', o: 'p', date: '2024-08-06', place: 'Cape Breton', from: 'jordan', tag: 'ns' },
    { seed: '13', o: 'l', date: '2023-07-02', place: 'Sandbanks', from: 'casey', tag: 'sandbanks' },
    { seed: '12', o: 'l', date: '2024-08-05', place: 'Cabot Trail, NS', from: 'jordan', tag: 'ns' },
    { seed: '28', o: 'l', date: '2020-09-27', place: 'Algonquin', from: 'alex', tag: 'algonquin' },
    { seed: '10', o: 'l', date: '2025-06-08', place: 'Prince Edward County', from: 'sam', tag: 'pec' },
    { seed: '47', o: 'l', date: '2025-07-19', place: 'Toronto Harbour', from: 'sam', tag: 'sail' },
    { seed: '52', o: 'l', date: '2024-07-14', place: 'Wasaga Beach', from: 'casey', tag: 'wasaga' },
    { seed: '59', o: 'p', date: '2025-10-25', place: "Chudleigh's", from: 'casey', tag: 'fall25' },
    { seed: '100', o: 'l', date: '2023-07-03', place: 'Sandbanks', from: 'jordan', tag: 'sandbanks' },
    { seed: '110', o: 'l', date: '2022-10-10', place: 'Bruce Peninsula', from: 'alex', tag: 'fall22' },
    { seed: '116', o: 'l', date: '2024-09-02', place: 'Niagara-on-the-Lake', from: 'jordan', tag: 'niagara' },
    { seed: '66', o: 'l', date: '2024-01-21', place: 'Blue Mountain', from: 'jordan', tag: 'winter24' },
    { seed: '38', o: 'l', date: '2025-08-16', place: 'Georgian Bay', from: 'alex', tag: 'gb' },
    { seed: '37', o: 'l', date: '2022-08-20', place: 'Bruce Peninsula', from: 'sam', tag: 'bruce' }
  ];

  // ---------------------------------------------------------------- AI agent usage (CodexBar-style)
  // left = minutes until the window resets; win = window length in minutes (for pace)
  var H5 = 300, DAY = 1440, WEEK = 10080, MONTH = 43200;
  var agents = [
    {
      id: 'claude', name: 'Claude', plan: 'Max 20×', color: '#D97757', rgb: '217 119 87', status: 'ok',
      meters: [
        { label: 'Session', win: H5, used: 62, left: 134 },
        { label: 'Weekly · all models', win: WEEK, used: 41, left: 4680 }
      ],
      tokens: 3.1, cost: 21.4, week: [2.2, 3.8, 2.9, 4.4, 1.6, 0.8, 3.1]
    },
    {
      id: 'codex', name: 'Codex', plan: 'ChatGPT Pro', color: '#10A37F', rgb: '16 163 127', status: 'ok',
      meters: [
        { label: 'Session', win: H5, used: 88, left: 38 },
        { label: 'Weekly', win: WEEK, used: 57, left: 7320 }
      ],
      tokens: 4.6, cost: 17.9, week: [3.1, 2.4, 5.2, 4.0, 2.2, 1.1, 4.6]
    },
    {
      id: 'cursor', name: 'Cursor', plan: 'Pro+', color: '#111111', rgb: '17 17 17', status: 'ok',
      meters: [
        { label: 'Included usage', win: MONTH, used: 76, left: 17280, detail: '$45.60 of $60' },
        { label: 'On-demand', win: MONTH, used: 16, left: 17280, detail: '$8.20 of $50 cap' }
      ],
      tokens: 1.8, cost: 6.3, week: [1.2, 1.9, 0.7, 2.3, 1.5, 0.4, 1.8]
    },
    {
      id: 'gemini', name: 'Gemini', plan: 'AI Ultra', color: '#3F6FE4', rgb: '63 111 228', status: 'ok',
      meters: [
        { label: 'Requests · daily', win: DAY, used: 16, left: 522, detail: '320 of 2,000' },
        { label: 'Pro model · daily', win: DAY, used: 52, left: 522, detail: '104 of 200' }
      ],
      tokens: 0.9, cost: 0, week: [0.4, 1.1, 0.6, 0.2, 0.9, 1.3, 0.9]
    },
    {
      id: 'copilot', name: 'Copilot', plan: 'Pro+', color: '#8957E5', rgb: '137 87 229', status: 'degraded', incident: 'Elevated errors on coding agent',
      meters: [
        { label: 'Premium requests', win: MONTH, used: 75, left: 17280, detail: '1,124 of 1,500' },
        { label: 'Coding agent', win: MONTH, used: 38, left: 17280, detail: '19 of 50 sessions' }
      ],
      tokens: 1.2, cost: 0, week: [0.9, 1.4, 1.1, 0.8, 1.6, 0.3, 1.2]
    }
  ];

  return {
    people: people, family: family, ALL: ALL,
    events: events,
    routines: routines, chores: chores, stars: stars, week: week,
    stores: stores, catOrder: catOrder, groceries: groceries, catalog: catalog, usuals: usuals,
    rooms: rooms, devices: devices, climate: climate, media: media, cameras: cameras, scenes: scenes,
    weather: weather, photos: photos, agents: agents,
    _gid: function () { return 'g' + (++gid); },
    _eid: function () { return 'e' + (++n); }
  };
})();
