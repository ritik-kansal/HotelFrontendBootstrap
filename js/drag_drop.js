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
});

function dragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.id);
  setTimeout(() => {
    e.target.classList.add("hide");
  }, 0);
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

  // add it to the drop target
  e.target.appendChild(draggable);

  // TODO: Save in History and Variable also

  // display the draggable element
  draggable.classList.remove("hide");
}
