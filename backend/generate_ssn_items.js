// Generate 421 SSN items for the database
const fs = require('fs');

const categories = [
  'Office Supplies',
  'Paper Products',
  'Writing Materials',
  'Office Equipment',
  'Cleaning Materials',
  'Computer Supplies',
  'Filing Materials',
  'Communication Materials'
];

const items = [
  'Bond Paper A4', 'Bond Paper Legal', 'Ballpen Black', 'Ballpen Blue', 'Pencil HB', 'Pencil 2B',
  'Highlighter Yellow', 'Highlighter Pink', 'Marker Red', 'Marker Blue', 'Eraser Rubber', 'Correction Pen',
  'Sticky Notes', 'Index Cards', 'Folder Manila', 'Folder Plastic', 'Binder Ring', 'Stapler',
  'Staples Box', 'Tape Dispenser', 'Masking Tape', 'Scotch Tape', 'Glue Stick', 'Correction Fluid',
  'Envelope A4', 'Envelope Long', 'Carbon Paper', 'Tissue Paper', 'Toilet Paper', 'Tissue Roll',
  'Cleaning Cloth', 'Mop Head', 'Broom', 'Dustpan', 'Vacuum Bag', 'Sponge',
  'Trash Bag Small', 'Trash Bag Large', 'Soap Dispenser', 'Hand Sanitizer', 'Disinfectant', 'Air Freshener',
  'Light Bulb LED', 'Light Bulb Incandescent', 'Adapter Cable USB', 'Extension Cord', 'Power Strip', 'Cable Organizer',
  'Keyboard', 'Mouse', 'Monitor Stand', 'Document Holder', 'Desk Organizer', 'Filing Cabinet',
  'Chair Cushion', 'Desk Lamp', 'Calendar Desk', 'Clock Wall', 'Whiteboard', 'Bulletin Board',
  'Scissors', 'Cutter Blade', 'Ruler Metal', 'Ruler Plastic', 'Compass', 'Protractor',
  'Calculator', 'Adding Machine', 'Time Clock', 'Stamp Pad', 'Stamp Ink', 'Ink Cartridge',
  'Toner Cartridge Black', 'Toner Cartridge Color', 'Thermal Paper', 'Receipt Book', 'Ledger Book', 'Notebook',
  'Desk Pad', 'Blotter Paper', 'Clip Board', 'Spring Clamp', 'Paper Clip Jumbo', 'Paper Clip Regular',
  'Push Pin', 'Safety Pin', 'Rubber Band', 'String Roll', 'Wire Binding', 'Spiral Binding',
  'Hole Punch', 'Staple Remover', 'Tape Cutter', 'Paper Shredder', 'Laminator', 'Perforator',
  'Storage Box Small', 'Storage Box Medium', 'Storage Box Large', 'Hanging Folder', 'Tab Divider', 'Expanding File',
  'Label Maker', 'Label Roll', 'Barcode Sticker', 'Shipping Label', 'Name Tag', 'Badge Holder',
  'Pen Holder', 'Document Tray', 'Mail Organizer', 'Key Cabinet', 'First Aid Kit', 'Safety Goggles',
  'Safety Gloves', 'Hard Hat', 'Dust Mask', 'Respirator', 'Apron', 'Lab Coat',
  'Coffee Maker', 'Water Cooler', 'Microwave', 'Refrigerator', 'Kettle', 'Toaster',
  'Plates Disposable', 'Cups Disposable', 'Utensils Disposable', 'Napkins', 'Paper Towel', 'Food Container',
  'Cooler Box', 'Lunch Box', 'Water Bottle', 'Thermos', 'Cup Holder', 'Ice Pack',
  'Plant Decoration', 'Picture Frame', 'Wall Decor', 'Floor Mat', 'Anti Fatigue Mat', 'Desk Plant',
  'Desk Screen Privacy', 'Monitor Privacy Film', 'Camera Webcam', 'Headphone', 'Speaker', 'Microphone',
  'USB Hub', 'Docking Station', 'Monitor Mount Arm', 'Keyboard Tray', 'Document Scanner', 'Fax Machine',
  'Phone System', 'PBX System', 'Intercom System', 'Buzzer System', 'Door Lock Electronic', 'Access Card',
  'Badge Scanner', 'Time Attendance System', 'CCTV Camera', 'Motion Sensor', 'Fire Extinguisher', 'Fire Alarm',
  'Emergency Light', 'Exit Sign', 'Safety Cone', 'Rope Nylon', 'Caution Tape', 'Warning Sign',
  'Floor Marking Tape', 'Electrical Tape', 'Duct Tape', 'Waterproof Tape', 'Painter Tape', 'Double Sided Tape',
  'Velcro Strip', 'Hook Adhesive', 'Magnet', 'Thumbtack', 'Brad Nail', 'Screw Assortment',
  'Bolt Assortment', 'Washer', 'Nut', 'Anchor', 'Hook Eye', 'Chain Link',
  'Padlock', 'Key Blank', 'Certificate Frame', 'Diploma Frame', 'Photo Album', 'Scrapbook',
  'Sticker', 'Decal', 'Transfer Sheet', 'Heat Transfer Paper', 'Vinyl Cutter', 'Laminating Pouch',
  'Binding Comb', 'Binding Spiral', 'Binding Wire', 'Binding Machine', 'Binding Cover', 'Binding Strip',
  'Business Card Holder', 'Business Card Box', 'Rolodex', 'Card File', 'Receipt Organizer', 'Invoice Organizer'
];

let sqlInserts = 'INSERT IGNORE INTO ssn_items (id, code, description, unit, category) VALUES ';
const insertValues = [];

let id = 8;
let itemIndex = 0;

// Generate 421 items
for (let i = 0; i < 421; i++) {
  const item = items[itemIndex % items.length];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const code = `SSN-${String(i + 1).padStart(4, '0')}`;
  const unit = ['piece', 'box', 'ream', 'dozen', 'unit', 'pack', 'roll', 'set'][Math.floor(Math.random() * 8)];
  
  insertValues.push(`('${id}', '${code}', '${item} #${i + 1}', '${unit}', '${category}')`);
  
  id++;
  itemIndex++;
}

sqlInserts += insertValues.join(',\n') + ';\n';

console.log(sqlInserts);
