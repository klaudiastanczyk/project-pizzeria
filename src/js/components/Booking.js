import AmountWidget from './AmountWidget.js';
import {templates, select, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element) {
    this.render(element);
    this.initWidgets();
    this.getData();
    this.initActions();
    this.prepareBooking();
  }

  getData(){
    const thisBooking = this; 
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(this.datePicker.minDate);
    const endDateParam =  settings.db.dateEndParamKey + '=' + utils.dateToStr(this.datePicker.maxDate);
    const params = {
      booking: [startDateParam,
        endDateParam,
      ],
      eventsCurrent: [settings.db.notRepeatParam,
        startDateParam,
        endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };
    
    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    
    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this; 

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let i = startHour; i < startHour + duration; i += 0.5){
      if(typeof thisBooking.booked[date][i] == 'undefined'){
        thisBooking.booked[date][i] = [];
      }
      thisBooking.booked[date][i].push(table);
    }
    thisBooking.updateDOM();
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.correctValue;
    thisBooking.hour = utils.hourToNumber(thisBooking.timePicker.correctValue);
    
    let allAvailable = false; 

    if(typeof thisBooking.booked[thisBooking.date] == 'undefined' || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)){
        table.classList.add(classNames.booking.tableBooked);
      }else{
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element){
    this.dom = {};
    this.dom.wrapper = element;
    const generatedHTML = templates.bookingWidget();
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    this.dom.wrapper.appendChild(generatedDOM);
    this.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    this.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    this.dom.time = document.querySelector(select.widgets.hourPicker.wrapper);
    this.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
    this.dom.tables = this.dom.wrapper.querySelectorAll(select.booking.tables);
  }

  initWidgets(){
    const thisBooking = this;
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
    this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
    console.log('peoplei hour', this.peopleAmount, this.hoursAmount);
    this.timePicker = new HourPicker(this.dom.time);
    this.datePicker = new DatePicker(this.dom.datePicker);

    this.dom.peopleAmount.addEventListener('updated', function(){});
    this.dom.hoursAmount.addEventListener('updated', function(){});

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
  }

  initActions(){
    const thisBooking = this;
    this.usedTables = [];
    const tables = document.querySelectorAll('.table');
    for(let table of tables){
      table.addEventListener('click', function(){
        const tableId = table.getAttribute('data-table');
        console.log('tableid', tableId);
        if(!table.classList.contains('booked')){
          if(thisBooking.usedTables.length == 0){
            table.classList.toggle('clicked');
            thisBooking.usedTables.push(tableId);
          } else {
            const oldTable = document.querySelector('[data-table = "'+ thisBooking.usedTables[0] +'"]');
            oldTable.classList.remove('clicked');
            console.log('old', oldTable);
            thisBooking.usedTables.pop();
            thisBooking.usedTables.push(tableId);
            table.classList.toggle('clicked');
            console.log('aktywne stoliki', thisBooking.usedTables);
          }
        } else {
          alert('Stolik niedostępny');
        }
      });
    }

    const buton = this.dom.wrapper.querySelector('.btn-secondary');
    console.log('button', buton);
    console.log('thisboking', this.dom);
    buton.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.prepareBooking();
    });
  }

  prepareBooking(){
    const summary = {};

    const start = [];

    const startery = this.dom.wrapper.querySelectorAll('.checkbox');
    console.log('startery', startery);
    for(let starter of startery){
      const element = starter.querySelector('input');
      if(element.checked){
        start.push(element.getAttribute('value'));
      }
    }

    summary.date = this.datePicker.value;
    summary.hour = this.timePicker.value;
    summary.table = parseInt(this.usedTables[0]);
    summary.duration = this.hoursAmount.correctValue;
    summary.ppl = this.peopleAmount.correctValue;
    summary.phone = this.dom.wrapper.querySelector('[name="phone"]').value;
    summary.address = this.dom.wrapper.querySelector('[name="address"]').value;
    summary.startery = start;

    console.log('summary', summary);

    const url = settings.db.url + '/' + settings.db.booking;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summary),
    };
    
    fetch(url, options);
  }

}

export default Booking;