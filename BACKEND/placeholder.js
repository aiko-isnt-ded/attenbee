// data/mockData.js

let users = [
  {
    _id: 'user_obj_id_1',
    name: 'Barista Principal',
    password: 'password123', // Min 4 characters
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let products = [
  {
    _id: 'prod_obj_id_1',
    product_id: 'cafe-colmena',
    category: 'cafe',
    image: '../../assets/colmena_logo.png',
    product_name: 'Café Colmena',
    price: 2000, // in cents ($20.00)
    total_units: null
  },
  {
    _id: 'prod_obj_id_2',
    product_id: 'americano',
    category: 'cafe',
    image: '../../assets/colmena_logo.png',
    product_name: 'Americano',
    price: 4000,
    total_units: null
  },
  {
    _id: 'prod_obj_id_3',
    product_id: 'pan-de-muerto',
    category: 'panaderia',
    image: '../../assets/colmena_logo.png',
    product_name: 'Pan de Muerto',
    price: 4000,
    total_units: 4
  },
  {
    _id: 'prod_obj_id_4',
    product_id: 'croissant',
    category: 'panaderia',
    image: '../../assets/colmena_logo.png',
    product_name: 'Croissant',
    price: 3500,
    total_units: 7
  },
  {
    _id: 'prod_obj_id_5',
    product_id: 'cafe-majomut',
    category: 'otros',
    image: '../../assets/colmena_logo.png',
    product_name: 'Café Majomut',
    price: 27000,
    total_units: 5
  }
];

let orders = [
  {
    _id: 'order_obj_id_12',
    order_id: 12,
    open_time: new Date('2026-06-06T10:35:00.000Z'),
    close_time: null,
    status: true, // true = open
    pre_total: 17000,
    total_pay_cash: 0,
    total_pay_card: 0
  },
  {
    _id: 'order_obj_id_13',
    order_id: 13,
    open_time: new Date('2026-06-06T10:42:00.000Z'),
    close_time: null,
    status: true,
    pre_total: 23000,
    total_pay_cash: 0,
    total_pay_card: 0
  }
];

let items = [
  {
    _id: 'item_obj_id_1',
    item_id: 'item-uuid-101',
    order_id: 12,
    product_id: 'latte-frio',
    qty: 2,
    total_price: 13000,
    details: ['PL', 'AM']
  },
  {
    _id: 'item_obj_id_2',
    item_id: 'item-uuid-102',
    order_id: 12,
    product_id: 'brownie',
    qty: 1,
    total_price: 4000,
    details: ['N']
  },
  {
    _id: 'item_obj_id_3',
    item_id: 'item-uuid-103',
    order_id: 13,
    product_id: 'latte-caliente',
    qty: 1,
    total_price: 23000,
    details: ['TP', 'MI']
  }
];

let registerCutData = {
  efectivo: { expectedCents: 21000, countedCents: 20800 },
  tarjeta: { expectedCents: 34250, countedCents: 34250 },
  yesterdayCents: 49800
};

module.exports = { users, products, orders, items, registerCutData };