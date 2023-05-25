import { Sequelize } from 'sequelize-typescript';
import Order from '../../../../domain/checkout/entity/order';
import OrderItem from '../../../../domain/checkout/entity/order_item';
import Customer from '../../../../domain/customer/entity/customer';
import Address from '../../../../domain/customer/value-object/address';
import Product from '../../../../domain/product/entity/product';
import CustomerModel from '../../../customer/repository/sequelize/customer.model';
import CustomerRepository from '../../../customer/repository/sequelize/customer.repository';
import ProductModel from '../../../product/repository/sequelize/product.model';
import ProductRepository from '../../../product/repository/sequelize/product.repository';
import OrderItemModel from './order-item.model';
import OrderModel from './order.model';
import OrderRepository from './order.repository';

describe('Order repository test', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('should create a new order', async () => {
    const { order, orderItem } = await createOrder();

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ['items'],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: '123',
      customer_id: '123',
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: '123',
          product_id: '123',
        },
      ],
    });
  });

  describe('find', () => {
    describe('when order exists', () => {
      it('returns the order', async () => {
        const { order } = await createOrder();

        const orderRepository = new OrderRepository();

        const result = await orderRepository.find(order.id);

        expect(result).toStrictEqual(order);
      });
    });

    describe('when order does not exist', () => {
      it('throws not found error', async () => {
        const orderRepository = new OrderRepository();

        await expect(orderRepository.find('no_id')).rejects.toThrow(
          'Order not found'
        );
      });
    });
  });

  describe('findAll', () => {
    it('returns all orders', async () => {
      const { order } = await createOrder();

      const orderRepository = new OrderRepository();

      const result = await orderRepository.findAll();

      expect(result).toStrictEqual([order]);
    });
  });

  describe('update', () => {
    it('changes the order', async () => {
      const { order } = await createOrder();

      const orderRepository = new OrderRepository();

      const productRepository = new ProductRepository();

      const product = new Product('456', 'Product 2', 20);

      await productRepository.create(product);

      const orderItem = new OrderItem(
        '2',
        product.name,
        product.price,
        product.id,
        3
      );

      order.items.push(orderItem);

      await orderRepository.update(order);

      const result = await OrderModel.findOne({
        where: { id: order.id },
        include: ['items'],
      });

      expect(result.toJSON()).toStrictEqual({
        id: '123',
        customer_id: '123',
        total: 80,
        items: [
          {
            id: '1',
            name: 'Product 1',
            price: 10,
            quantity: 2,
            order_id: '123',
            product_id: '123',
          },
          {
            id: '2',
            name: 'Product 2',
            price: 20,
            quantity: 3,
            order_id: '123',
            product_id: '456',
          },
        ],
      });
    });
  });
});

async function createOrder() {
  const customerRepository = new CustomerRepository();
  const customer = new Customer('123', 'Customer 1');
  const address = new Address('Street 1', 1, 'Zipcode 1', 'City 1');
  customer.changeAddress(address);
  await customerRepository.create(customer);

  const productRepository = new ProductRepository();
  const product = new Product('123', 'Product 1', 10);
  await productRepository.create(product);

  const orderItem = new OrderItem(
    '1',
    product.name,
    product.price,
    product.id,
    2
  );

  const order = new Order('123', '123', [orderItem]);

  const orderRepository = new OrderRepository();
  await orderRepository.create(order);
  return { order, orderItem };
}
