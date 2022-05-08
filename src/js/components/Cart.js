import {settings, classNames, select, templates } from '../settings.js';
import CartProduct from './CartProduct.js';
import {utils} from '../utils.js';

class Cart{
  constructor(element){
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();

  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
  }

  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });

    thisCart.dom.wrapper.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });

  }

  add(menuProduct){
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
    const listOfProd = thisCart.dom.wrapper.querySelector(select.cart.productList);
    const generatedDom = utils.createDOMFromHTML(generatedHTML);
    listOfProd.appendChild(generatedDom);
    thisCart.products.push(new CartProduct(menuProduct, generatedDom));
    console.log('thusCart.prod', thisCart.products);
    console.log('adding product', menuProduct);
    thisCart.update();
    
  }

  update(){
    const thisCart = this;
    const deliveryFee = settings.cart.defaultDeliveryFee;
    this.totalNumber = 0;
    this.subtotalPrice = 0;

    for(let productInProd of thisCart.products){
      this.totalNumber = parseInt(productInProd.amount) + this.totalNumber;

      this.subtotalPrice = productInProd.price + this.subtotalPrice;
    }
    thisCart.totalPrice = this.subtotalPrice + deliveryFee;
    if(this.totalNumber == 0){
      thisCart.totalPrice = thisCart.totalPrice - deliveryFee;
    }
    console.log('total price', thisCart.totalPrice);
    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = this.subtotalPrice;
    thisCart.dom.totalNumber.innerHTML = this.totalNumber;
    for(let totprice of thisCart.dom.totalPrice){
      totprice.innerHTML = this.totalPrice;
    }
  }
  
  remove(product){
    const thisCart = this;
    const index = thisCart.products.indexOf(product);
    product.dom.wrapper.remove();
    thisCart.products.splice(index, 1);
    
    thisCart.update();
  }

  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;
    const payload = {};
    payload.products = [];
    payload.totalPrice = this.totalPrice;
    payload.address = thisCart.dom.address.value;
    payload.phone = thisCart.dom.phone.value;
    payload.subtotalPrice = this.subtotalPrice;
    payload.totalNumber = this.totalNumber;
    payload.deliveryFee = settings.cart.defaultDeliveryFee;

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    console.log('payload', payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    
    fetch(url, options);

  }
}

export default Cart;