let global_location_id = ""

class Guest{

  static guests = new Map();

  constructor(payload,id){
    this.id = id;
    this.name = payload["NAME"];
    this.age = payload["AGE"];
    this.gender = payload["GENDER"];
    this.room_type = payload["ROOM_TYPE"];
    this.room_text = payload["ROOM_TEXT"];
    this.keys = ["age", "gender", "room_type", "room_text"];
    this.color = this.getColor(this.room_type);

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


  getColor = (room_type) => {
    if (room_type == "1") {
      return "danger";
    }
    if (room_type == "2") {
      return "primary";
    }
    if (room_type == "3") {
      return "warning";
    }
  };

  getGuestLiteral(){
    return `
      <div class="item bg-${this.color}" id="${this.id}" draggable="true" ondragstart="Guest.dragStart(event)" ondragend="Guest.dragEnd(event)">
        <div class="name">${this.name}</div>
        <div class="properties">
          ${this.keys.map(key => {
            
            let value = this[key];
            if(value){
              return `<div class="property" key="${key}" value="${value}">${key}: ${value}</div>`;
            }
          }
          ).join("")}
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
    this.capacity = payload["capacity"];
    this.color = payload["color"];
    this.location_id = location_id;
    
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

  static editName(e) {
    const $name = $(e.currentTarget).siblings('.name');
    const box_container_id = $(e.currentTarget).closest('.box_container').attr('id');
    const box_container = BoxContainer.getBoxContainerById(box_container_id);
    
    const text = box_container.name;
    var $input = $('<input>').val(text);
    $name.replaceWith($input);
    $input.focus();
    
    // add a blur event listener
    $input.on('blur', function(e) {
      box_container.name = $input.val();
      box_container.updateBoxContainer();
    });

    // add a keypress event listener
    $input.on('keypress', function(e) {
      if (e.key === 'Enter') {  
        box_container.name = $input.val();
        box_container.updateBoxContainer();
      }
    });
  }

  static getRoomType = (capacity) => {
    if (capacity == "1") {
      return "Single";
    }
    if (capacity == "2") {
      return "Double";
    }
    if (capacity == "3") {
      return "Triple";
    }
  };
  
  static getRoomColor = (capacity) => {
    if (capacity == "1") {
      return "danger";
    }
    if (capacity == "2") {
      return "primary";
    }
    if (capacity == "3") {
      return "warning";
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

    const des_capacity = des_box_container.capacity;
    const des_guests_length = des_box_container.guests.length;
    
    // if capacity is not reached
    if (des_guests_length < des_capacity) {
      let room_type = guest.room_type;
      let guestName = guest.name;
      let guestAge = guest.age;
      if(src_box_container.location_id == des_box_container.location_id){
        if(room_type >= des_capacity || des_capacity == 10000){
        
          src_box_container.removeGuestById(guest_id);
          des_box_container.addGuest(guest);
          
          let history_payload = {
            "creataAt": Date.now(),
            "message" : `Moved <strong>${guestName}</strong>(${guestAge}) from ${src_box_container.name} to ${  des_box_container.name}`,
          } 
  
          let location = Location.getLocationById(des_box_container.location_id);
          location.addHistoryByPayload(history_payload);
          location.updateLocation();
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
      <div id="${this.id}" class="box_container ${this.name == "Room Temporary" ? " temp" : ""}">
        <div class="box_name bg-${this.color}" color="${this.color}">
          <div class="close">^</div>
          <div class="name">${this.name}</div>
          <div class="edit" onclick="BoxContainer.editName(event)">Edit</div>
        </div>

        <div class="box" capacity="${this.capacity}" ondrop="BoxContainer.drop(event)" ondragover="BoxContainer.dragOver(event)" ondragenter="BoxContainer.dragEnter(event)" ondragleave="BoxContainer.dragLeave(event)">
          ${this.guests.map(guest => guest.getGuestLiteral()).join("")}
        </div>
      </div>
    `;
  }
}

class History{
  constructor(payload,location_id){
    this.message = payload["message"];
    this.createdAt = new Date(payload["creataAt"]).toLocaleString();
    this.location_id = location_id;
  }

  getHistoryLiteral(){
    return `
      <div class="history-block">
        <div class="msg">${this.message}</div>
        <div class="time">${this.createdAt}</div>
      </div>
    `;
  }
}

class Location{

  static locations = new Map();

  constructor(payload,id){
    this.id = id;
    this.name = payload["city"];
    this.arrivalDate = payload["arrivalDate"];
    this.departureDate = payload["departureDate"];
    this.groupId = payload["groupId"];
    this.tripCode = payload["tripCode"];
    this.boxContainers = payload["boards"].map((room,index) => {
      return new BoxContainer(room,`${index}`, this.id);
    });
    this.history = payload["history"].map(history => {
      
      return new History(history, this.id);
    });

    Location.locations.set(this.id,this);
  }

  static getLocationById(id){
    return Location.locations.get(id);
  }

  addHistoryByPayload(history_payload){
    let newHistory = new History(history_payload,this.id);
    this.history.unshift(newHistory);
  }

  getBoxContainersLiteral(){
    let rooming_list = this.boxContainers.map(boxContainer => boxContainer.getBoxContainerLiteral()).join("");
    return rooming_list;
  }

  getHistorysLiteral(){
    let history_list = this.history.map(history => history.getHistoryLiteral()).join("");
    return history_list;
  }

  getLocationLiteral() {
    let location_literal = `
      <div id="${this.id}" class="location">
        
        <div class="location_properties">
          <div class="name">City Name: ${this.name}</div>
          <div class="arrivalDate">Arrival Date: ${this.arrivalDate}</div>
          <div class="departureDate">Departure Date: ${this.departureDate}</div>
          <div class="groupId">Group Id: ${this.groupId}</div>
          <div class="tripCode">Trip Code: ${this.tripCode}</div>
        </div>
        
        <div class="my-5 d-flex justify-content-center align-items-center gap-10">
          <button class="btn btn-primary moveToTemp" location_id="${this.id}">Move to temp</button>
          <button class="btn btn-primary showAddRoomModal" location_id="${this.id}" data-toggle="modal" data-target="#addRoomModal">Add Room</button>
          <button class="btn btn-primary showDeleteRoomModal" location_id="${this.id}" data-toggle="modal" data-target="#deleteRoomModal" >Delete Room</button>
          <button class="btn btn-primary showAddGuestModal" location_id="${this.id}" data-toggle="modal" data-target="#addGuestModal" >Add Guest</button>
        </div>
        <div class="drop-targets">
          ${
            this.getBoxContainersLiteral()
          }
        </div>
        <div class="history text-center">
          <h2>History</h2>
          <div class="history-list text-left">
            ${
              this.getHistorysLiteral()
            }
          </div>
        </div>
      </div>
    `
    return location_literal;
  }

  // add BoxContainer to location
  addBoxContainer(boxContainer_payload){
    let boxContainer_id = this.boxContainers.length + 1;
    let newBoxContainer = new BoxContainer(boxContainer_payload, this.id + "_" + boxContainer_id, this.location_id);
    this.boxContainers.push(newBoxContainer);
  }

  // remove BoxContainer from location
  removeBoxContainer(boxContainer){
    BoxContainer.removeBoxContainerById(boxContainer.id);
    this.boxContainers = this.boxContainers.filter(b => b.id != boxContainer.id);
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
  };
  
  createNewBoxContainer = (capacity) => {
    let box_container_count = this.boxContainers.length;
    this.addBoxContainer(
      {
        title: `Room ${box_container_count}-${BoxContainer.getRoomType(capacity)}`,
        color: BoxContainer.getRoomColor(capacity),
        capacity: capacity,
        guests: [],
      }
    );
  }

  updateLocation(){
    $(`#${this.id}`).replaceWith(this.getLocationLiteral());
    attachMainButtons();
  }

  createLocation(){
    $(".container-fluid").append(this.getLocationLiteral());
    attachMainButtons();
  }
}

const getData = async () => {
  // TODO: replace with actual data

  // dummy input - read json
  const data = await fetch("https://ritik-kansal.github.io/HotelFrontendBootstrap/dummy_input.json")
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
  $(`.moveToTemp`).click((event)=>{
    var current = event.target;
    global_location_id = $(current).attr('location_id');

    let location = Location.getLocationById(global_location_id);
    location.moveAllGuestsToTemp();
    location.updateLocation();
  })
  $(`.showAddRoomModal`).click((event)=>{
    var current = event.target;
    global_location_id = $(current).attr('location_id')
    
  })
  $(`.showDeleteRoomModal`).click((event)=>{
    var current = event.target;
    global_location_id = $(current).attr('location_id');
    
    addRoomOptions("#deleteRoomSelect");
  })
  $(`.showAddGuestModal`).click((event)=>{
    var current = event.target;
    global_location_id = $(current).attr('location_id');
    
    addRoomOptions("#addGuestSelect");
  })
}

const attachModalFunctions = () => {
  $("#addRoom").click(() => {
    let capacity = $("#addRoomSelect").val();
    let location = Location.getLocationById(global_location_id);
    location.createNewBoxContainer(capacity);
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
  let capacity = box_container.capacity;
  
  if (guests_length >= capacity) {
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
            <option value="1">Single</option>
            <option value="2">Double</option>
            <option value="3">Triple</option>
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
    "NAME" : $("#guestNameInput").val(),
    "AGE" : $("#guestAgeInput").val(),
    "ROOM_TYPE" : $("#guestRoomTypeInput").val(),
    "ROOM_TEXT" : $("#guestRoomTextInput").val(),
    "GENDER" : $("#guestGenderInput").val()
  };
  
  // add guest to board
  let box_container_id = $("#addGuestSelect").val();

  let box_container = BoxContainer.getBoxContainerById(box_container_id);
  
  box_container.addGuestByPayload(guest_payload);
  box_container.updateBoxContainer();
  

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
  // clear drop-targets
  let location = new Location(data["responseData"]["roomData"][0],"location_1");
  location.createLocation();

  let location2 = new Location(data["responseData"]["roomData"][1],"location_2");
  location2.createLocation();
};

// when document is ready
$(document).ready(async () => {
  let data = await getData();
  await createElements(data);
  attachModalFunctions();
});
