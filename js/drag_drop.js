let global_location_id = ""

class Guest{

  static guests = new Map();

  constructor(payload,id){
    this.id = id;
    this.name = payload["name"];
    this.age = payload["age"];
    this.gender = payload["sex"];
    this.room_type = payload["room_selection"];
    this.room_text = payload["room_text"];
    this.keys = ["age", "gender", "room_type", "room_text"];

    Guest.guests.set(this.id,this);
  }

  static getGuestById(id){
    return Guest.guests.get(id);
  }

  static dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
    e.dataTransfer.setData("src_box_container_id", $(e.currentTarget).closest('.box_container').attr('id'));
    
    setTimeout(() => {
      e.target.classList.add("hide");
    }, 0);
  }

  static dragEnd(e) {
    e.target.classList.remove("hide");
  }

  getGuestLiteral(){
    return `
      <div class="item bg-white rounded-sm" id="${this.id}" draggable="true" ondragstart="Guest.dragStart(event)" ondragend="Guest.dragEnd(event)">
        <div class="name ml-2">${this.name}</div>
        <div class="properties">
          <div class="d-flex justify-between">
            <div class="" key="age" value="${this['age']}">Age: ${this['age']}</div>
            <div class="ml-4" key="gender" value="${this['gender']}">Gender: ${this['gender']}</div>
          </div>
          <div class="bg-${this.room_type} px-4 py-1 rounded-pill">
            <div class="text-white" key="room_type" value="${this['room_type']}">${this['room_type'][0].toUpperCase() + this['room_type'].slice(1)}</div>
          </div>
        </div>
      </div>
    `;
  }
}

class BoxContainer{

  static boxContainers = new Map();

  constructor(payload,id,location_id){
    
    this.id = payload['title'] != "Room Temporary" ? `box_container_id-${location_id}_${id}` : `box_container_id-${location_id}_temp_id`;
    this.name = payload["title"];
    this.room_type = payload["room_type"];
    this.room_size = payload["room_size"];
    this.color = payload["color"];
    this.location_id = location_id;
    this.areGuestsHidden = false;
    
    let guest_id = id; // Counter variable for guest IDs
    
    this.guests = payload["guests"].map(guest => {
      const newGuest = new Guest(guest, id + "_"+ guest_id); // Assign the current ID to the guest
      guest_id++; // Increment the ID for the next guest
      return newGuest;
    });

    BoxContainer.boxContainers.set(this.id,this);
  }

  static getBoxContainerById(id){
    return BoxContainer.boxContainers.get(id);
  }

  static removeBoxContainerById(id){
    BoxContainer.boxContainers.delete(id);
  }

  static addNameChangetoHistory(location_id, old_name, new_name){
    let page = Page.currentPage;
    let message= `
        <div>
          Name for room <strong>${old_name}</strong> changed to <strong>${new_name}</strong>
        </div>
      `;
    // page.addHistoryByMessage(message, location_id);
  }

  static editName(e) {
    const $name = $(e.currentTarget).siblings('.name');
    const box_container_id = $(e.currentTarget).closest('.box_container').attr('id');
    const box_container = BoxContainer.getBoxContainerById(box_container_id);
    
    const old_name = box_container.name;
    var $input = $('<input>').val(old_name);
    $name.replaceWith($input);
    $input.focus();
    
    // add a blur event listener
    $input.on('blur', function(e) {
      box_container.name = $input.val();
      box_container.updateBoxContainer();
      BoxContainer.addNameChangetoHistory(box_container.location_id, old_name, box_container.name);
    });

    // add a keypress event listener
    $input.on('keypress', function(e) {
      if (e.key === 'Enter') {  
        box_container.name = $input.val();
        box_container.updateBoxContainer();
        BoxContainer.addNameChangetoHistory(box_container.location_id, old_name, box_container.name);
      }
    });
  }

  static toggleHideGuests(e){
    const box_container_id = $(e.currentTarget).closest('.box_container').attr('id');
    const box_container = BoxContainer.getBoxContainerById(box_container_id);
    box_container.areGuestsHidden = !box_container.areGuestsHidden;
    box_container.updateBoxContainer();
  }

  static getRoomTenantType = (guest) => {
    if (guest.age < 18) {
      return guest.gender == "F" ? 1 : 2;
    } else {
      return guest.gender == "F" ? 3 : 4;
    }
  };

  static dragEnter(e) {
    e.preventDefault();
    e.target.classList.add("drag-over");
  }

  static dragOver(e) {
    e.preventDefault();
    e.target.classList.add("drag-over");
  }

  static dragLeave(e) {
    e.target.classList.remove("drag-over");
  }

  static drop(e) {
    e.target.classList.remove("drag-over");

    const src_box_container_id = e.dataTransfer.getData("src_box_container_id");
    const src_box_container = BoxContainer.getBoxContainerById(src_box_container_id);
    
    const des_box_container_id = $(e.currentTarget).closest('.box_container').attr('id');
    const des_box_container = BoxContainer.getBoxContainerById(des_box_container_id);
    
    const guest_id = e.dataTransfer.getData("text/plain");
    const guest = Guest.getGuestById(guest_id);

    const des_capacity = des_box_container.room_size;
    const des_guests_length = des_box_container.guests.length;
    
    // if room_size is not reached
    if (des_guests_length < des_capacity) {
      let room_type = guest.room_type;
      let guestName = guest.name;
      let guestAge = guest.age;
      if(src_box_container.location_id == des_box_container.location_id){
        if(room_type >= des_capacity || des_capacity == 10000){
        
          src_box_container.removeGuestById(guest_id);
          des_box_container.addGuest(guest);

          src_box_container.updateBoxContainer();
          des_box_container.updateBoxContainer();

          let message = `
              <div>
                Moved <strong>${guestName}</strong>(${guestAge}) from <strong>${src_box_container.name}</strong> to <strong>${des_box_container.name}</strong>
              </div>
            `;
          
          let page = Page.currentPage;
          // page.addHistoryByMessage(message, src_box_container.location_id);
        }
        else{alert("Can not downgrade room type")}
      }
      else{
        alert("Can not move guest to another location")
      }
      
    }
    else{
      alert("Room is full")
    }
  }

  addGuestByPayload(guest_payload){
    let guest_id = this.guests.length + 1;
    let newGuest = new Guest(guest_payload, this.id + "_" + guest_id);
    this.guests.push(newGuest);
  }
  
  addGuest(guest){
    this.guests.push(guest);
  }

  removeGuestById(id){
    this.guests = this.guests.filter(guest => guest.id != id);
  }

  updateBoxContainer(){
    $(`#${this.id}`).replaceWith(this.getBoxContainerLiteral());
  }

  getBoxContainerLiteral(){
    return `
      <div id="${this.id}" class="box_container ${this.name == "Room Temporary" ? 'temp' : ''}">
        ${
          this.name == "Room Temporary" ?
          ''
          :
          `
          <div class="box_name bg-${this.color}" color="${this.color}">
            <div>
              <div class="edit d-inline-block" onclick="BoxContainer.editName(event)">
                <img src="../assets/img/bed.svg" />
              </div>
              <div class="name d-inline-block ml-3">${this.name}</div>
            </div>
            <div onclick="BoxContainer.toggleHideGuests(event)" class="pointer">
              ${
                this.areGuestsHidden ?
                `<img src="../assets/img/arrow_up.svg" />`
                :
                `<img src="../assets/img/arrow_down.svg" />`
              }
            </div>
          </div>
          `
        }
        
        ${
          this.areGuestsHidden ?
            `<div></div>`
          :
          `
            <div class="box" room_size="${this.room_size}" ondrop="BoxContainer.drop(event)" ondragover="BoxContainer.dragOver(event)" ondragenter="BoxContainer.dragEnter(event)" ondragleave="BoxContainer.dragLeave(event)">
              ${this.guests.map(guest => guest.getGuestLiteral()).join("")}
            </div>
          `
        }
      </div>
    `;
  }
}

// class History{
//   constructor(payload){
//     this.message = payload["message"];
//     this.createdAt = new Date(payload["creataAt"]).toLocaleString();
//   }

//   getHistoryLiteral(){
//     return `
//       <div class="history-block">
//         <div class="msg">${this.message}</div>
//         <div class="time">${this.createdAt}</div>
//       </div>
//     `;
//   }
// }

class Location{

  static locations = new Map();

  constructor(payload,id){
    this.id = id;
    this.name = payload["city"];
    this.arrivalDate = payload["arrivalDate"];
    this.departureDate = payload["departureDate"];
    this.groupId = payload["groupId"];
    this.tripCode = payload["tripCode"];
    this.totalPaxCount = 0;
    this.singleRoomCount = 0;
    this.twinRoomCount = 0;
    this.doubleRoomCount = 0;
    this.tripleRoomCount = 0;
    this.boxContainers = payload["boards"].map((room,index) => {
      this.totalPaxCount += room["guests"].length;
      
      if(room["color"] == 'single'){
        this.singleRoomCount += 1;
      }
      else if(room["color"] == 'twin'){
        this.twinRoomCount += 1;
      }
      else if(room["color"] == 'double'){
        this.doubleRoomCount += 1;
      }
      else if(room["color"] == 'triple'){
        this.tripleRoomCount += 1;
      }

      return new BoxContainer(room,`${index}`, this.id);
    });
 

    Location.locations.set(this.id,this);
  }

  static getLocationById(id){
    return Location.locations.get(id);
  }

  static toggleAllGuests(e){
    console.log("here");
    const location_id = $(e.currentTarget).closest('.location').attr('id');
    const location = Location.getLocationById(location_id);
    location.boxContainers.forEach(boxContainer => {
      if(boxContainer.name != "Room Temporary")
      {

      boxContainer.areGuestsHidden = !boxContainer.areGuestsHidden;
      boxContainer.updateBoxContainer();
      }
    });
  }

  getBoxContainersLiteral(){
    let literal = "";
    let tempRoom = null;
    let rooming_list = this.boxContainers.map(boxContainer => {
      if(boxContainer.name != "Room Temporary"){
        return boxContainer.getBoxContainerLiteral()
      }
      else{
        tempRoom = boxContainer;
      }
    }).join("");
    literal = `
      <div class="w-100">
        <div class="font-weight-bold mb-2 text-uppercase"> Participants </div>
        <div class='position-relative w-100 h-100'>
          ${tempRoom.getBoxContainerLiteral()}
        </div>
      </div>
      <div class="w-100">
      <div  class="d-flex mb-2 justify-content-between"> 
        <div class="font-weight-bold text-uppercase"> Rooms </div>
        <div class="pointer link-color border-link" onclick="Location.toggleAllGuests(event)"> Toggle All </div>
      </div>
        ${rooming_list}
      </div>
    `
    return literal;
  }

  getHistorysLiteral(){
    let history_list = this.history.map(history => history.getHistoryLiteral()).join("");
    return history_list;
  }

  // <div class="location_properties ">
  // <div class="name">City Name: ${this.name}</div>
  // <div class="arrivalDate">Arrival Date: ${this.arrivalDate}</div>
  // <div class="departureDate">Departure Date: ${this.departureDate}</div>
  // <div class="groupId">Group Id: ${this.groupId}</div>
  // <div class="tripCode">Trip Code: ${this.tripCode}</div>
  // </div>
  getLocationLiteral() {
    let location_literal = `
      <div id="${this.id}" class="location">
        
        
        
        <div class="my-5 d-flex justify-content-center align-items-center gap-10">
          <button class="btn btn-primary moveToTemp" location_id="${this.id}">Move to temp</button>
          <button class="btn btn-primary showAddRoomModal" location_id="${this.id}" data-toggle="modal" data-target="#addRoomModal">Add Room</button>
          <button class="btn btn-primary showDeleteRoomModal" location_id="${this.id}" data-toggle="modal" data-target="#deleteRoomModal" >Delete Room</button>
          <button class="btn btn-primary showAddGuestModal" location_id="${this.id}" data-toggle="modal" data-target="#addGuestModal" >Add Guest</button>
        </div>

        <div class="container">
          <div class="d-flex align-items-center gap-10 mb-3">
            <div class="">ROOM COUNT: <span class="font-weight-bold">${this.boxContainers.length}</span></div>
            <div class="">TOTAL PAX COUNT: <span class="font-weight-bold">${this.totalPaxCount}</span></div>
            <div class="d-flex">
              <div class="bg-single text-white rounded-pill px-3 py-2 mr-1">SINGLE: ${this.singleRoomCount}</div>
              <div class="bg-twin text-white rounded-pill px-3 py-2 mr-1">Twin: ${this.twinRoomCount}</div>
              <div class="bg-double text-white rounded-pill px-3 py-2 mr-1">DOUBLE: ${this.doubleRoomCount}</div>
              <div class="bg-triple text-white rounded-pill px-3 py-2 mr-1">TRIPLE: ${this.tripleRoomCount}</div>
            </div>
          </div>

          <div class="drop-targets">
            ${
              this.getBoxContainersLiteral()
            }
          </div>
        </div>
        
      </div>
    `
    return location_literal;
  }

  // add BoxContainer to location
  addBoxContainer(boxContainer_payload){
    let boxContainer_id = this.boxContainers.length;
    let newBoxContainer = new BoxContainer(boxContainer_payload, this.id + "_" + boxContainer_id, this.id);
    this.boxContainers.push(newBoxContainer);
  }

  // remove BoxContainer from location
  removeBoxContainer(boxContainer){
    BoxContainer.removeBoxContainerById(boxContainer.id);
    this.boxContainers = this.boxContainers.filter(b => b.id != boxContainer.id);

    let page = Page.currentPage;
    let message= `
        <div>
          <strong>${boxContainer.name}</strong> deleted.
        </div>
      `;

    // page.addHistoryByMessage(message, this.id);
  }

  moveAllGuestsToTemp = () => {
    let temp = BoxContainer.getBoxContainerById(`box_container_id-${this.id}_temp_id`);
  
    this.boxContainers.forEach((boxContainer) => {
      if (boxContainer.id != temp.id) {
        boxContainer.guests.forEach((guest) => {
          temp.addGuest(guest);
        });
        boxContainer.guests = [];
      }
    });


    let page = Page.currentPage;
    let message= `
        <div>
          All Guests moved to temporary room.
        </div>
      `;

    // page.addHistoryByMessage(message, this.id);
  };
  
  createNewBoxContainer = (room_type, room_size) => {
    let box_container_count = this.boxContainers.length;
    this.addBoxContainer(
      {
        title: `Room ${box_container_count}-${room_type[0].toUpperCase() + room_type.slice(1)}`,
        color: room_type,
        capacity: room_size,
        guests: [],
      }
    );

    let page = Page.currentPage;
    
    let message=`
        <div>
          New Room Created. <br />Room Name: <strong>Room ${box_container_count}-${room_type[0].toUpperCase() + room_type.slice(1)}</strong>
        </div>
      `;

    // page.addHistoryByMessage(message, this.id);
  }

  updateLocation(){
    $(`#${this.id}`).replaceWith(this.getLocationLiteral());
  }

  createLocation(){
    $(".container-fluid").append(this.getLocationLiteral());
  }
}

class Page{

  static currentPage = null;

  constructor(payload){
    this.locations = payload.map((location,index) => {
      return new Location(location,`${index}`);
    });

    // TODO: there will be common history for all locations
    // this.history = payload[0]["history"].map((history,index) => {
    //   return new History(history);
    // });

    Page.currentPage = this;
  }

  // addHistoryByMessage(message, location_id){
  //   let location = Location.getLocationById(location_id);
  //   console.log(location, location_id);
  //   let history_payload = {
  //     message: `
  //       ${message}
  //       <div class="time">
  //         Date Range: ${location.arrivalDate} to ${location.departureDate}
  //       </div>
  //     `,
  //     createdAt: new Date().toLocaleString(),
  //   };
  //   this.addHistoryByPayload(history_payload);
  //   this.updateHistory();
  // }
  
  getLocationsLiteral(){
    let location_list = this.locations.map(location => location.getLocationLiteral()).join("");
    return location_list;
  }

  getHistorysLiteral(){
    let history_list = this.history.map(history => history.getHistoryLiteral()).join("");
    return history_list;
  }

  // addHistoryByPayload(payload){
  //   let newHistory = new History(payload);
  //   // add to top of history
  //   this.history.unshift(newHistory);
  // }

  // updateHistory(){
  //   let history_list = `
  //     <div class="history-list text-left">
  //       ${
  //         this.getHistorysLiteral()
  //       }
  //     </div>
  //   `;
  //   $(".history-list").replaceWith(history_list);
  // }

  getPageLiteral(){
    let page_literal = `
      <div class="locations">
        ${
          this.getLocationsLiteral()
        }     
      </div>
    `
    return page_literal;
  }

  // TODO: commented history
  // <div class="history text-center">
  //         <h2>History</h2>
  //         <div class="history-list text-left">
  //           ${
  //             this.getHistorysLiteral()
  //           }
  //         </div>
  //       </div>

  createPage(){
    $(".container-fluid").append(this.getPageLiteral());
  }
}

const getData = async () => {
  // TODO: replace with actual data

  // dummy input - read json
  const data = await fetch("./dummy_input_3.json")
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      return null;
    });

  return data;
};

const attachMainButtons = () => {
  // set global location id
  $(document).on('click', '.moveToTemp', function(event) {
    var current = event.target;
    global_location_id = $(current).attr('location_id');
  
    let location = Location.getLocationById(global_location_id);
    location.moveAllGuestsToTemp();
    location.updateLocation();
  });
  
  $(document).on('click', '.showAddRoomModal', function(event) {
    var current = event.target;
    global_location_id = $(current).attr('location_id');
  });
  
  $(document).on('click', '.showDeleteRoomModal', function(event) {
    var current = event.target;
    global_location_id = $(current).attr('location_id');
  
    addRoomOptions("#deleteRoomSelect");
  });
  
  $(document).on('click', '.showAddGuestModal', function(event) {
    var current = event.target;
    global_location_id = $(current).attr('location_id');
  
    addRoomOptions("#addGuestSelect");
  });
}

const attachModalFunctions = () => {
  $("#addRoom").click(() => {
    let room_type = $("#addRoomSelect").val();
    let location = Location.getLocationById(global_location_id);
    let roomSizeMap = { triple: 4, twin: 3, double: 2, single: 1 };
    location.createNewBoxContainer(room_type, roomSizeMap[room_type]);
    location.updateLocation();
  });

  $("#deleteRoomSelect").change(async () => {
    verifyDeleteRoom();
  });

  $("#deleteRoom").click(async () => {
    // get board id
    verifyDeleteRoom();
    
    let box_container_id = $("#deleteRoomSelect").val();
    let box_container = BoxContainer.getBoxContainerById(box_container_id);
    let location = Location.getLocationById(global_location_id);

    location.removeBoxContainer(box_container);
    location.updateLocation();
  });

  $("#addGuestSelect").change(async () => {
    let box_container_id = $("#addGuestSelect").val();
    addGuestForm(box_container_id);
  });

  
};


const addRoomOptions = (select_id) => {
  let boards = Location.getLocationById(global_location_id).boxContainers;

  $(select_id).empty();
  // append empty option
  $(select_id).append(`<option value=''>Select a room</option>`);
  boards.forEach((board) => {
    $(select_id).append(`<option value='${board["id"]}'>${board["name"]}</option>`);
  });
};

const addGuestForm = (box_container_id) => {
  let box_container = BoxContainer.getBoxContainerById(box_container_id);

  let guests_length = box_container.guests.length;
  let room_size = box_container.room_size;
  
  if (guests_length >= room_size) {
    // if yes, show text
    $("#deleteWarningAddGuest").text("Room is full. Please select another room.");
    $("#addGuestModalBody").empty();
    return false;
  } else {
    // if no, show button
    $("#deleteWarningAddGuest").text("");
    $("#addGuestModalBody").empty();

    let form = `
      <form onsubmit="addGuestSubmit(event)">
        <div class="form-group">
          <label for="guestNameInput">Name</label>
          <input type="text" required class="form-control" id="guestNameInput" aria-describedby="emailHelp" />
        </div>
        <div class="form-group">
          <label for="guestAgeInput">Age</label>
          <input type="number" min="0" max="150" required class="form-control" id="guestAgeInput" />
        </div>
        <div class="form-group">
          <label for="guestGenderInput">Gender</label>
          <select required class="form-control custom-select" id="guestGenderInput" >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div class="form-group">
          <label for="guestRoomTypeInput">Room Type</label>
          <select required class="custom-select" id="guestRoomTypeInput" >
            <option value="single">Single</option>
            <option value="twin">Twin</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
          </select>
        </div>
        <div class="form-group">
          <label for="guestRoomTextInput">Room Text</label>
          <input type="text" min="1" max="3" class="form-control" id="guestRoomTextInput" />
        </div>
        <button type="submit" class="btn btn-primary" >Submit</button>
      </form>
      `;
    $("#addGuestModalBody").append(form);
    // on submit of form
  }
};

const addGuestSubmit = async (e) => {
  // prevent default
  e.stopImmediatePropagation();
  e.preventDefault();

  // create payload
  let guest_payload = {
    "name" : $("#guestNameInput").val(),
    "age" : $("#guestAgeInput").val(),
    "room_selection" : $("#guestRoomTypeInput").val(),
    "room_text" : $("#guestRoomTextInput").val(),
    "sex" : $("#guestGenderInput").val()
  };

  console.log("guest_payload", guest_payload);
  
  // add guest to board
  let box_container_id = $("#addGuestSelect").val();

  let box_container = BoxContainer.getBoxContainerById(box_container_id);
  
  box_container.addGuestByPayload(guest_payload);
  box_container.updateBoxContainer();

  let page = Page.currentPage;
  
  let message = `
      <div>
        Guest Added: <br/>
        Name: <strong>${guest_payload.NAME}</strong>(${guest_payload.AGE}) <br/>
        Room: <strong>${box_container.name}</strong> <br/>
      </div>
    `;

  // page.addHistoryByMessage(message,box_container.location_id);
  

  // dismiss modal addGuestModal
  $("#addGuestModalBody").empty();
  $("#addGuestModal").modal("hide");

};

const verifyDeleteRoom = () => {
  let box_container_id = $("#deleteRoomSelect").val();
  let box_container = BoxContainer.getBoxContainerById(box_container_id);

  // get items length in box
  let guests = box_container.guests;

  if (guests.length > 0) {
    // if yes, show text
    $("#deleteWarning").text("Room has guests. Please move them to temporary room first.");
    $("#deleteRoom").prop("disabled", true);
  } else if (box_container_id.endsWith("temp_id")) {
    $("#deleteWarning").text("Cannot delete temporary room.");
    $("#deleteRoom").prop("disabled", true);
  } else {
    // if no, show button
    $("#deleteWarning").text("");
    $("#deleteRoom").prop("disabled", false);
  }
}

// create html elements from data
const createElements = (data) => {
  let page = new Page(data["responseData"]["roomData"]);
  page.createPage();
};

const sortDataWithRoomType = (pax_list,roomSizeMap) =>{
  var sortedData = {};

  for (var room_type in roomSizeMap) {
    sortedData[room_type] = {
      "Female Children": [],
      "Male Children": [],
      "Female Adults": [],
      "Male Adults": [],
    };
  }

  for (let i = 0; i < pax_list.length; ++i) {
    let tenantType = "";

    if (pax_list[i]["sex"] === "M") {
      if (parseInt(pax_list[i]["age"]) >= 18) {
        tenantType = "Male Adults";
      } else {
        tenantType = "Male Children";
      }
    } else {
      if (parseInt(pax_list[i]["age"]) >= 18) {
        tenantType = "Female Adults";
      } else {
        tenantType = "Female Children";
      }
    } 

    let roomType = pax_list[i]["room_selection"];

    if (tenantType !== "") sortedData[roomType][tenantType].push(pax_list[i]);
  }

  return sortedData;
}


const processData = (data) => {
  const roomSizeMap = { triple: 3, twin: 2, double: 2, single: 1 };
  var logicData = {};
  let sortedData =  sortDataWithRoomType(data["pax_list"],roomSizeMap);
  console.log("sortedData", sortedData);
  
  let occupantTypes = ["Female Children", "Male Children", "Female Adults", "Male Adults"];

  
  let room_count = data["room_counts"];

  let rooms = {};  
  rooms['single'] = { Rooms: [], available: room_count['singles'] };
  rooms['double'] = { Rooms: [], available: room_count['doubles'] };
  rooms['twin'] = { Rooms: [], available: room_count['twins'] };
  rooms['triple'] = { Rooms: [], available: room_count['triples'] };

  let Temporary = { guests: [] };


  // fill rooms
  Object.entries(rooms)?.forEach(([room_type, room]) => {
    let occupantTypesIndex = 0;
    while (room.available > 0 && occupantTypesIndex < occupantTypes.length) {
      let currentRoom = [];
      let tempIndex = null;
      for (let j = 0; j < roomSizeMap[room_type]; j++) {
        tempIndex = occupantTypesIndex;
        if (sortedData[room_type][occupantTypes[occupantTypesIndex]].length > 0) {
          currentRoom.push(sortedData[room_type][occupantTypes[occupantTypesIndex]].pop());
        } else {
          occupantTypesIndex++;
          break;
        }
      }
      if (currentRoom.length > 0) {
        room.Rooms.push(currentRoom);
        room.available--;
      }
    }
  });


  

  // add remaining occupants to temporary rooms
  occupantTypesIndex = 0;
  // Iterate over occupantTypes
  while (occupantTypesIndex < occupantTypes.length) {
    // iterate through room sizes
    for (var room_type in roomSizeMap) {
      // if there are still occupants of this type and there are still rooms of size less then current room size, try to fill them
      while (sortedData[room_type][occupantTypes[occupantTypesIndex]].length > 0) {
        Temporary.guests.push(sortedData[room_type][occupantTypes[occupantTypesIndex]].pop());
      }
    }
    occupantTypesIndex++;
  }

  console.log(rooms);

  // sum all the rooms and push to logicData
  Object.keys(rooms)?.forEach((key) => {
    logicData[key] = rooms[key].Rooms;
  });

  logicData["Temporary"] = Temporary.guests;

  console.log("logicData: ", logicData);
  
  let arr = [];
  let count = 0;
  Object.keys(logicData)?.forEach((key) => {
    if( key != "Temporary"){
      for (let i = 0; i < logicData[key].length; ++i) {
        
        arr.push({
          state: count,
          guests: logicData[key][i],
          title: `Room ${count + 1}-${key[0].toUpperCase() + key.slice(1)}`,
          color: key,
          accept: BoxContainer.getRoomTenantType(new Guest(logicData[key][i])),
          room_size: roomSizeMap[key],
        });
        count++;
      }
    }
  });

  if("Temporary" in logicData){
    arr.push({
      state: count,
      guests: logicData["Temporary"],
      title: `Room Temporary`,
      color: "secondary",
      accept: "all",
      room_size: 10000,
    });
  }

  return arr;
}

// when document is ready
$(document).ready(async () => {
  let data = await getData();

  let processed_data = processData(data);
  data["boards"] = processed_data;
  let final_data = {
    responseData: {
      isLocked: false,
      createdDate: new Date().toLocaleString(),
      roomData: [data],
      tripId: "123456",
      updatedDate: new Date().toLocaleString(),
      version: "1.0",
    }
  };

  console.log("final_data: ", final_data);

  await createElements(final_data);
  attachModalFunctions();
  attachMainButtons();
});