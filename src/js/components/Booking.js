import { templates } from '../settings.js';


class Booking{
  constructor(element){
    this.render(element);
    // initWidgets();
  }
  
  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
  }
}

export default Booking;
