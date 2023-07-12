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

const getColor = (guest) => {
  if (guest["ROOM_TYPE"] == "1") {
    return "danger";
  }
  if (guest["ROOM_TYPE"] == "2") {
    return "primary";
  }
  if (guest["ROOM_TYPE"] == "3") {
    return "warning";
  }
};

const getRoomType = (capacity) => {
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

const getRoomColor = (capacity) => {
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

// create html elements from data
const createElements = (data) => {
  // clear drop-targets
  $(".drop-targets").empty();

  // TODO: update to process multiple locations/arrival dates
  let id = 0;
  let keys = ["AGE", "GENDER", "ROOM_TYPE", "ROOM_TEXT"];
  let box_container_id = 0;
  $.each(data["responseData"]["roomData"][0]["boards"], function (ind, room) {
    box_container_id++;
    box_container_literal = `
      <div id="${room["title"] == "Room Temporary" ? "temp_id" : "box_container_id-" + box_container_id}" class="box_container ${room["title"] == "Room Temporary" ? " temp" : ""}">
        <div class="box_name bg-${room["color"]}" color="${room["color"]}">
          <div class="close">^</div>
          <div class="name">${room["title"]}</div>
          <div class="edit">Edit</div>
        </div>
        <div class="box" capacity="${room["capacity"]}">
        ${room["guests"]
          .map((guest) => {
            id++;
            return `
              <div class="item bg-${getColor(guest)}" id="${id}" draggable="true">
                <div class="name">${guest["NAME"]}</div>
                <div class="properties">
                  ${keys
                    .map((key) => {
                      value = guest[key];
                      if (value) {
                        return `<div class="property" key="${key}" value="${value}">${key}: ${value}</div>`;
                      }
                    })
                    .join("")}
                </div>
              </div>
              `;
          })
          .join("")}
          
        </div>
      </div>    
    `;

    $(".drop-targets").append(box_container_literal);
  });
};

function editName(e) {
  // select sibling with class name "name"
  const name = e.target.previousElementSibling;
  // get the text content
  const text = name.textContent;
  // create an input element
  const input = document.createElement("input");
  // set the input value to the text content
  input.value = text;
  // replace the name with the input
  name.replaceWith(input);
  // focus on the input
  input.focus();
  // add a blur event listener
  input.addEventListener("blur", function () {
    // create a new name element
    const name = document.createElement("div");
    name.classList.add("name");
    name.textContent = input.value;
    input.replaceWith(name);
  });

  //   change the name to edit after enter
  input.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      const name = document.createElement("div");
      name.classList.add("name");
      name.textContent = input.value;
      input.replaceWith(name);

      // TODO: Save name in History and Variable also
    }
  });
}

const attachFunctions = () => {
  const editList = document.querySelectorAll(".edit");
  // add a click event listener
  editList.forEach(function (edit) {
    edit.addEventListener("click", editName);
  });

  /* draggable element */
  const items = document.querySelectorAll(".item");

  items.forEach((item) => {
    item.addEventListener("dragstart", dragStart);
    item.addEventListener("dragend", dragEnd);
  });

  function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.id);

    setTimeout(() => {
      e.target.classList.add("hide");
    }, 0);
  }

  function dragEnd(e) {
    e.target.classList.remove("hide");
  }

  const boxes = document.querySelectorAll(".box");

  boxes.forEach((box) => {
    box.addEventListener("dragenter", dragEnter);
    box.addEventListener("dragover", dragOver);
    box.addEventListener("dragleave", dragLeave);
    box.addEventListener("drop", drop);
  });

  function dragEnter(e) {
    e.preventDefault();
    e.target.classList.add("drag-over");
  }

  function dragOver(e) {
    e.preventDefault();
    e.target.classList.add("drag-over");
  }

  function dragLeave(e) {
    e.target.classList.remove("drag-over");
  }

  function drop(e) {
    e.target.classList.remove("drag-over");

    // get the draggable element
    const id = e.dataTransfer.getData("text/plain");
    const draggable = document.getElementById(id);

    // e.target.appendChild(draggable);
    // console.log(e);
    console.log(draggable);

    // add it to the drop target
    const box = e.target.closest(".box");
    // check attribute capacity of box
    let capacity = box.getAttribute("capacity");
    // check number of guests in box
    let guests = box.querySelectorAll(".item").length;
    // if capacity is not reached
    if (guests < capacity) {
      box.appendChild(draggable);
      // TODO: Save in History and Variable also
    }

    // display the draggable element
    draggable.classList.remove("hide");
  }
};

const moveToTemp = async (data) => {
  let newData = {};
  newData["responseData"] = {};
  newData["responseData"]["roomData"] = [];
  newData["responseData"]["roomData"][0] = {};
  newData["responseData"]["roomData"][0]["boards"] = [];

  let boards = data["responseData"]["roomData"][0]["boards"];
  let temp = {
    capacity: 10000,
    color: "danger",
    guests: [],
    state: -1,
    title: "Room Temporary",
  };
  let i = 0;
  boards.forEach((board) => {
    // move guests array to temp
    temp["guests"] = temp["guests"].concat(board["guests"]);
    // empty guests array
    board["guests"] = [];
    // if not temporary room, add to new data
    if (board["title"] != "Room Temporary") {
      newData["responseData"]["roomData"][0]["boards"][i] = board;
      i++;
    }
  });
  newData["responseData"]["roomData"][0]["boards"][i] = temp;

  await createElements(newData);

  return newData;
};

const addRoom = async (data, capacity) => {
  let last_board = data["responseData"]["roomData"][0]["boards"].length; //id is 1 based index

  box_container_literal = `
      <div class="box_container">
        <div class="box_name bg-${getRoomColor(capacity)}" color="${getRoomColor(capacity)}">
          <div class="close">^</div>
          <div class="name">${`Room ${last_board}-${getRoomType(capacity)}`}</div>
          <div class="edit">Edit</div>
        </div>
        <div class="box" capacity="${capacity}"> 
        </div>
      </div>    
    `;

  $(".drop-targets").append(box_container_literal);
};

// Return updated data based on current state
const getDataFromElements = () => {
  let data = {};

  // TODO: add other attributes
  data["responseData"] = {};
  data["responseData"]["roomData"] = [];
  data["responseData"]["roomData"][0] = {};

  let boards = [];

  let box_container = document.querySelectorAll(".box_container");
  box_container.forEach((container) => {
    let board = {};
    board["id"] = container.getAttribute("id");
    board["title"] = container.querySelector(".name").textContent;
    board["color"] = container.querySelector(".box_name").getAttribute("color");
    board["capacity"] = container.querySelector(".box").getAttribute("capacity");

    let items = container.querySelector(".box").querySelectorAll(".item");

    guests = [];

    items.forEach((item) => {
      let guest = {};
      guest["NAME"] = item.querySelector(".name").textContent;

      let properties = item.querySelectorAll(".property");
      properties.forEach((property) => {
        guest[property.getAttribute("key")] = property.getAttribute("value");
      });

      guests.push(guest);
    });

    board["guests"] = guests;
    boards.push(board);
  });

  data["responseData"]["roomData"][0]["boards"] = boards;

  return data;
};

const addRoomOptions = (data, select_id) => {
  data = getDataFromElements();
  // add room names as options in #addRoomSelect
  let boards = data["responseData"]["roomData"][0]["boards"];

  $(select_id).empty();
  boards.forEach((board) => {
    $(select_id).append(`<option value='${board["id"]}'>${board["title"]}</option>`);
  });
};

const addGuestForm = (box_container) => {
  let board = box_container.querySelector(".box");

  let guests = board.querySelectorAll(".item");
  let capacity = board.getAttribute("capacity");
  console.log(guests.length >= capacity);
  if (guests.length >= capacity) {
    // if yes, show text
    $("#deleteWarningAddGuest").text("Room is full. Please select another room.");
    $("#addGuestModalBody").empty();
    return false;
  } else {
    // if no, show button
    $("#deleteWarningAddGuest").text("");
    $("#addGuestModalBody").empty();

    let form = `
      <form onsubmit="addGuest(event)">
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

const addGuest = async (e) => {
  // prevent default
  e.stopImmediatePropagation();
  e.preventDefault();
  // get data from form
  let guest = {};
  guest["NAME"] = $("#guestNameInput").val();
  guest["AGE"] = $("#guestAgeInput").val();
  guest["ROOM_TYPE"] = $("#guestRoomTypeInput").val();
  guest["ROOM_TEXT"] = $("#guestRoomTextInput").val();
  guest["GENDER"] = $("#guestGenderInput").val();

  // add guest to board
  let box_container_id = $("#addGuestSelect").val();

  // getcolor

  // get length of total guests
  let id = document.querySelectorAll(".item").length + 1; //1 based index

  let keys = ["AGE", "GENDER", "ROOM_TYPE", "ROOM_TEXT"];
  let guest_literal = `
  <div class="item bg-${getColor(guest)}" id="${id + 1}" draggable="true">
    <div class="name">${guest["NAME"]}</div>
    <div class="properties">
      ${keys
        .map((key) => {
          value = guest[key];
          if (value) {
            return `<div class="property" key="${key}" value="${value}">${key}: ${value}</div>`;
          }
        })
        .join("")}
    </div>
  </div>
  `;

  $(`#${box_container_id} .box`).append(guest_literal);

  // dismiss modal addGuestModal
  $("#addGuestModalBody").empty();
  $("#addGuestModal").modal("hide");

  attachFunctions();
};

// when document is ready
$(document).ready(async () => {
  let data = await getData();
  await createElements(data);
  attachFunctions();

  $("#moveToTemp").click(async () => {
    data = getDataFromElements();

    data = await moveToTemp(data);
    attachFunctions();
    // TODO: Save in History and Variable also
  });

  $("#addRoom").click(async () => {
    data = getDataFromElements();

    let capacity = $("#addRoomSelect").val();

    data = await addRoom(data, capacity);
    attachFunctions();
  });

  $("#deleteRoomModalBtn").click(async () => {
    addRoomOptions(data, "#deleteRoomSelect");
  });

  $("#addGuestModalBtn").click(async () => {
    addRoomOptions(data, "#addGuestSelect");
  });

  // on change of #deleteRoomSelect
  $("#deleteRoomSelect").change(async () => {
    // check if select room have guests
    let box_container_id = $("#deleteRoomSelect").val();
    let box_container = document.getElementById(box_container_id);
    console.log(box_container_id);
    console.log(box_container);

    // get items length in box
    let items = box_container.querySelector(".box").querySelectorAll(".item");

    if (items.length > 0) {
      // if yes, show text
      $("#deleteWarning").text("Room has guests. Please move them to temporary room first.");
    } else if (box_container_id == "temp_id") {
      $("#deleteWarning").text("Cannot delete temporary room.");
    } else {
      // if no, show button
      $("#deleteWarning").text("");
      // delete box_container
    }
  });

  $("#deleteRoom").click(async () => {
    // get board id
    let box_container_id = $("#deleteRoomSelect").val();

    if (box_container_id == "temp_id") {
      return;
    }

    // delete box_container
    let box_container = document.getElementById(box_container_id);
    box_container.remove();
  });

  $("#addGuestSelect").change(async () => {
    // check if select room have guests
    let box_container_id = $("#addGuestSelect").val();

    let box_container = document.getElementById(box_container_id);

    addGuestForm(box_container);
  });
});
