import Order from '../../../../domain/checkout/entity/order';
import OrderItemModel from './order-item.model';
import OrderModel from './order.model';
import OrderRepositoryInterface from '../../../../domain/checkout/repository/order-repository.interface';
import OrderItem from '../../../../domain/checkout/entity/order_item';

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async find(id: string): Promise<Order> {
    try {
      const orderModel = await OrderModel.findOne({
        where: { id },
        include: OrderItemModel,
        rejectOnEmpty: true,
      });

      const orderItems = orderModel.items.map((i) => {
        return new OrderItem(i.id, i.name, i.price, i.product_id, i.quantity);
      });

      return new Order(orderModel.id, orderModel.customer_id, orderItems);
    } catch (error) {
      throw new Error('Order not found');
    }
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: OrderItemModel,
    });

    const orders = orderModels.map((o) => {
      const orderItems = o.items.map((i) => {
        return new OrderItem(i.id, i.name, i.price, i.product_id, i.quantity);
      });

      return new Order(o.id, o.customer_id, orderItems);
    });

    return orders;
  }

  async update(entity: Order): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
