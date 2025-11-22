import { SupportFaqRecord } from '../../domain/entities/support/SupportFaq.entity';

export const supportFaqs: SupportFaqRecord[] = [
  {
    id: 'order-placement',
    category: 'order',
    question: {
      vi: 'Làm thế nào để đặt hàng trên Fresh Market?',
      en: 'How do I place an order on Fresh Market?'
    },
    answer: {
      vi: 'Chọn sản phẩm bạn muốn, thêm vào giỏ hàng và hoàn tất thanh toán. Đơn hàng sẽ được xác nhận ngay sau khi bạn thanh toán thành công.',
      en: 'Choose the products you want, add them to the cart, and complete the checkout. Your order will be confirmed as soon as the payment succeeds.'
    },
  helpful: 0,
  notHelpful: 0,
    keywords: ['order', 'checkout', 'giỏ hàng', 'thanh toán']
  },
  {
    id: 'delivery-time',
    category: 'shipping',
    question: {
      vi: 'Thời gian giao hàng là bao lâu?',
      en: 'How long does delivery take?'
    },
    answer: {
      vi: 'Đơn hàng nội thành Hà Nội và TP.HCM sẽ được giao trong vòng 60 phút. Các khu vực khác sẽ nhận hàng trong 1-2 ngày làm việc.',
      en: 'Orders within Hanoi and Ho Chi Minh City are delivered within 60 minutes. Other locations receive products in 1-2 business days.'
    },
  helpful: 0,
  notHelpful: 0,
    keywords: ['delivery', 'shipping', 'giao hàng', 'thời gian']
  },
  {
    id: 'order-tracking',
    category: 'order',
    question: {
      vi: 'Làm sao để theo dõi trạng thái đơn hàng?',
      en: 'How can I track my order status?'
    },
    answer: {
      vi: 'Bạn có thể theo dõi đơn hàng trong mục "Đơn hàng" của tài khoản. Chúng tôi sẽ gửi thông báo mỗi khi đơn hàng thay đổi trạng thái.',
      en: 'You can track your orders in the "Orders" section of your account. We send notifications whenever the order status changes.'
    },
  helpful: 0,
  notHelpful: 0,
    keywords: ['tracking', 'trạng thái', 'orders']
  },
  {
    id: 'refund-policy',
    category: 'refund',
    question: {
      vi: 'Chính sách hoàn tiền của Fresh Market như thế nào?',
      en: 'What is Fresh Market’s refund policy?'
    },
    answer: {
      vi: 'Nếu sản phẩm không đạt chất lượng, bạn có thể yêu cầu hoàn tiền trong vòng 48 giờ kể từ khi nhận hàng. Đội ngũ CSKH sẽ hỗ trợ bạn ngay.',
      en: 'If the product does not meet quality standards, you can request a refund within 48 hours after receiving it. Our support team will assist you promptly.'
    },
  helpful: 0,
  notHelpful: 0,
    keywords: ['refund', 'hoàn tiền', 'quality']
  },
  {
    id: 'contact-support',
    category: 'support',
    question: {
      vi: 'Tôi có thể liên hệ hỗ trợ bằng những cách nào?',
      en: 'Which support channels are available?'
    },
    answer: {
      vi: 'Bạn có thể liên hệ qua hotline 1800-1234, email support@freshmarket.vn hoặc chat trực tiếp trên ứng dụng.',
      en: 'You can contact us via hotline 1800-1234, email support@freshmarket.vn, or live chat in the app.'
    },
  helpful: 0,
  notHelpful: 0,
    keywords: ['support', 'liên hệ', 'hotline', 'email', 'chat']
  },
  {
    id: 'payment-methods',
    category: 'payment',
    question: {
      vi: 'Những phương thức thanh toán nào được chấp nhận?',
      en: 'Which payment methods are accepted?'
    },
    answer: {
      vi: 'Chúng tôi hỗ trợ thanh toán qua tiền mặt khi nhận hàng (COD) và cổng thanh toán VNPay.',
      en: 'We currently support cash on delivery (COD) and VNPay gateway payments.'
    },
  helpful: 0,
  notHelpful: 0,
    keywords: ['payment', 'thanh toán', 'methods']
  }
];
