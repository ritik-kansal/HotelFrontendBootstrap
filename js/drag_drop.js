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

// create html elements from data
const createElements = (data) => {
  // clear drop-targets
  $(".drop-targets").empty();

  console.log(data);
  // TODO: update to process multiple locations/arrival dates

  var i, item, properties, key, value;
  i = 0;
  $.each(data["responseData"]["roomData"][0]["boards"], function (ind, room) {
    console.log(ind, room);
    // box_container = $('<div class="box_container"></div>');
    // add temp class to box_container if title is "Room Temporary"
    box_container = $('<div class="box_container' + (room["title"] == "Room Temporary" ? " temp" : "") + '"></div>');

    box_name = $('<div class="box_name bg-' + room["color"] + '"></div>');
    box_name.append('<div class="collapse">^</div>');
    box_name.append('<div class="name">' + room["title"] + "</div>");
    box_name.append('<div class="edit">Edit</div>');

    box = $('<div class="box"></div>');

    room["guests"].forEach((guest) => {
      i++;
      item = $('<div class="item bg-' + getColor(guest) + '" id="' + i + '" draggable="true">' + '<div class="name">' + room["title"] + "</div>" + '<div class="properties">' + "</div>" + "</div>");

      properties = item.find(".properties");

      let keys = ["AGE", "GENDER", "ROOM_TYPE", "ROOM_TEXT"];
      keys.forEach((key) => {
        value = guest[key];
        if (value) {
          properties.append('<div class="property">' + key + ": " + value + "</div>");
        }
      });

      box.append(item);
    });

    box_container.append(box_name);
    box_container.append(box);
    $(".drop-targets").append(box_container);
  });
};

const attachFunctions = () => {
  const editList = document.querySelectorAll(".edit");
  // add a click event listener
  editList.forEach(function (edit) {
    edit.addEventListener("click", editName);
  });

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
      const name = document.createElement("span");
      // set the text content to the input value
      name.textContent = input.value;
      // replace the input with the name
      input.replaceWith(name);
    });

    //   change the name to edit after enter
    input.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        const name = document.createElement("span");
        name.textContent = input.value;
        input.replaceWith(name);

        // TODO: Save name in History and Variable also
      }
    });
  }

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
    box.appendChild(draggable);

    // TODO: Save in History and Variable also

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
};

// when document is ready
$(document).ready(async () => {
  let data = await getData();
  await createElements(data);
  attachFunctions();

  $("#moveToTemp").click(() => {
    data = moveToTemp(data);
  });
});
