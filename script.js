// When the window is > 1450px wide the basket is active as there is enough space for it
if (window.innerWidth > 1450) {
	var basketOn = true;
}
else {
	var basketOn = false;
}

// The array which stores the basket contents is initialised
var item = {};

// On document ready
$( document ).ready(function(){
	// Runs through each key in the localStorage and sends it to loadBasket
	// This adds the saved items into the basket
	for (var key in localStorage){
		loadBasket(key, JSON.parse(localStorage.getItem(key)));
	}	
	
	// Sets the products to be draggable
	var c = {};
	$( "#product-table tr" ).draggable({ 
		// Contains the product within the page to prevent it being dragged past the edges
		containment: "#page",
		scroll: false,
		
		revert: 'invalid',
		helper: "clone",
		
		// Clones the product 
		start: function(event, ui) {
			c.tr = this;
			c.helper = ui.helper;
			
			// Adds the dragged class to the object being dragged
			$(ui.helper).addClass("dragged");
			
			// Shows the basket
			$("#basket").show();
			basketOn = true;
			
			// While being dragged revert is true
			$(this).draggable('option', 'revert', true);
			
			// Sets the background colour of the basket button to be active
			document.getElementById("basket-show").style.background = "#003E94";
		}
	});
	
	// Sets the basket as droppable
	$( "#basket" ).droppable({
		// Basket accepts draggable items of class "product-trable tr"
		accept: "#product-table tr",
		
		// Sets the background colour of the basket to be lighter, indicating a target area
		activeClass: "basket-target",
		
		// Sets the background colour of the basket when an item is held over it, indicating it can be dropped
		hoverClass: "basket-hover",
		drop:function(event, ui) {
			// Sets basket to the basket element
			var basket = $(this),
				move = ui.draggable,
				itemId = basket.find("tr[data-id='" + move.attr("data-id") + "']");
				itemPrice = parseFloat(itemId.find(".basket-price").attr("value"));
				
			ui.draggable.draggable('option', 'revert', true);
			
			// If this item is in the basket
			if (itemId.html() != null) {
				// Increases the value of the quantity of the item
				itemId.find("input").val(parseInt(itemId.find("input").val()) + 1);
				// Adds the price on to the existing price
				itemPrice = itemPrice + parseFloat(move.find("h3").attr("value"));
				// Writes the new itemPrice to the value of .basket-price
				itemId.find(".basket-price").attr("value", itemPrice);
				// Writes the new itemPrice to the html of .basket-price
				itemId.find(".basket-price").html("&pound" + Math.abs(itemPrice.toFixed(2)));
				// Sends the price of the new item to calcTotal so that it can be added to the existing total
				calcTotal(parseFloat(move.find("h3").attr("value")));
				// Sends the data-id, name, price and quantity to the saveBasket function
				saveBasket(move.attr("data-id"), move.find("h2").html(), itemPrice, 1)
				
				// When the item is dropped, revert becomes false, stopping a correctly dropped item from reverting
				$("#product-table tr").draggable({
					revert: false
				});
			}
			// If this product is not in the basket
			else {
				// Sends the basket and the item to the addBasket function
				addBasket(basket, move);
				
				// When the item is dropped, revert becomes false, stopping a correctly dropped item from reverting
				$("#product-table tr").draggable({
					revert: false
				});
			}
		}
		
	});
	
	// Handles the delete button located on each item in the basket
	$( "#basket-table" ).on("click", ".basket-del", function() {
		// When there are multiples of the item they are deleted one by one
		if (parseFloat($(this).parent().children().find("input").val()) > 1 ){
			// Takes the current price on the item
			var oldPrice = parseFloat($(this).parent().children(".basket-price").attr("value"));
			// Calculates the newPrice removing oldPrice/(Number of items) from oldPrice.  Removing one items price from the total
			var newPrice = oldPrice - (oldPrice / parseFloat($(this).parent().children().find("input").val()));
			// Sets the .basket-price value of the item to the new number
			$(this).parent().children(".basket-price").attr("value", newPrice);
			// Sets the .basket-price html of the item to the new number with the pound sign
			$(this).parent().children(".basket-price").html("&pound" + Math.abs(newPrice.toFixed(2)));
			// Decreases the quantity by 1
			$(this).parent().children().find("input").val(parseInt($(this).parent().children().find("input").val()) - 1);
			// Sends the difference between the newPrice and oldPrice to calcTotal so that the items price can be removed from basket total
			calcTotal(parseFloat(newPrice - oldPrice));
			// Sets the new quantity of the item to a variable
			var quantity = ($(this).parent().children().find("input").val())
			// Calls the saveBasketDel function that sets the new quantity of the item to the localStorage
			saveBasketDel($(this).parent().attr("data-id"), $(this).parent().children(".basket-name").html(), newPrice, quantity);
		}
		// When there is only one item
		else {
			// Sends the negative price of the item to calcTotal so that it can remove the value from the total
			calcTotal(-($(this).parent().children(".basket-price").attr("value")));
			// Removes the closest "tr" to the delete button, in this case it removes the item from the basket
			$(this).closest("tr").remove();
			// Removes the item with the corresponding data-id from the localStorage
			localStorage.removeItem($(this).parent().attr("data-id"));
		}
		
	});
});

// Used to delete individual items from the localStorage
function saveBasketDel(id, name, price, quantity) {
	// Sets the array item to the name, price and new quantity of the basket item that was removed
	item.name = name;
	item.price = price;
	item.quantity = quantity;
	// Writes new item (quantity) to the id it represents, changing the quantity in the localStorage
	localStorage.setItem(id, JSON.stringify(item));
}

// Used to add items to the basket that do not currently exist there
function addBasket(basket, move) {
	// Gets the price of the item from the ui.draggable (the product being dropped)
	var price = move.find("h3").attr("value");
	
	// Appends html to the #basket-table element
	// Adds a table row with the items data-id for future reference
	basket.find("#basket-table").append("<tr data-id='" + move.attr("data-id") + "'>" 
			// Adds a td with the name of the item
			+ "<td class='basket-name'>" + move.find("h2").html() + "</td>"
			// Adds a td with the price of the item and the value is set to the price
			+ "<td class='basket-price' value='" + price + "'>" + "&pound" + price + "</td>"
			// Adds a td with the quantity of the item which in this case is always 1
			+ "<td class='basket-count'>" + "<input type='text' value='1' readonly> " + "</input>" + "</td>"
			// Adds a td containing the delete button
			+ "<td class='basket-del'>" + "<button>" + "X" + "</button>" + "</td>" + "</tr>");
	// Sends the price of the new item to calcTotal so that it can be added to the basket total
	calcTotal(parseFloat(price));
	// Sends the data-id, name, price and quantity of 1 to saveBasket so that the new item can be saved to localStorage
	saveBasket(move.attr("data-id"),move.find("h2").html(),price, 1);
}

// Initialises totalPrice to 0 to avoid mathematical errors when making totalPrice equal to itself
var totalPrice = 0;
function calcTotal(difference) {
	// Adds the difference that calcTotal has been passed to the current totalPrice
	totalPrice = parseFloat(totalPrice + difference);
	// Adds the new totalPrice to the html of the Basket Total, displaying it to 2 decimal places
	$("#basket-total").html("&pound" + Math.abs(totalPrice.toFixed(2)));
}

// Handles the showing of the basket
function basketShow() {
	// When basketOn is false the basket is not being displayed
	if (basketOn == false) {
		// Sets the display style to "block" showing the basket
		document.getElementById("basket").style.display = "block";
		// Sets the background color of the basket show button, indicating it is active
		document.getElementById("basket-show").style.background = "#003E94";
		// Sets basketOn to true for use when hiding the basket
		basketOn = true;
	}
	else {
		// When basket is being displayed the basket is set to display "none" hiding it
		document.getElementById("basket").style.display = "none";
		// Sets the background color of the basket show button to transparent (its default color)
		document.getElementById("basket-show").style.background = "transparent";
		// Sets basketOn to false for use when showing the basket
		basketOn = false;
	}
}

// Saves the basket to the localStorage when given an id, name, price and quantity
function saveBasket(id, name, price, quantity) {
	// Resets keyCount to 0, keyCount keeps count of the keys currently in localStorage
	var keyCount = 0;
	
	// Runs through each key in the localStorage and increments keyCount for each key
	for (var key in localStorage){
		keyCount++;
	}
	
	// If there are keys in the localStorage
	if (keyCount > 0) {
		// For every key in localStorage
		for (var key in localStorage){
			// If the key matches the id given, that item is already in the basket
			if (key == id) {
				// Gets the existing information for that item and sets it to a variable
				var oldItem = JSON.parse(localStorage.getItem(id));
				// Sets the items price to the new price value that saveBasket was given
				oldItem.price = price;
				// Increments the quantity by 1
				oldItem.quantity++;
				// Stores the updated item back in the localStorage at its key position of id
				localStorage.setItem(id, JSON.stringify(oldItem));
				// Escapes the current function to prevent more items being added by accident
				return;
			}
		}
		// Sets the item to the name, price and quantity given to saveBasket
		item.name = name;
		item.price = price;
		item.quantity = quantity;
		
		// Saves the new item to localStorage under the key of its id
		localStorage.setItem(id, JSON.stringify(item));
	}
	// If there are no items in localStorage it must be a new one
	else {
		// Sets the item to the name, price and quantity given to saveBasket
		item.name = name;
		item.price = price;
		item.quantity = quantity;
		// Saves the new item to localStorage under its id
		localStorage.setItem(id, JSON.stringify(item));
	}
}

// Used to load existing items in the localStorage, into the basket
function loadBasket(id, input) {
	// Sets basketTable to the basket table in the basket
	var basketTable = $("#basket-table")
	var n = parseFloat(input.price);
	var newPrice = (n.toFixed(2));
	// Appends the a tr with the id and 4 td's that contain the name, price and quantity of the items as well as adding the delete button
	basketTable.append("<tr data-id='" + id + "'>" 
			+ "<td class='basket-name'>" + input.name + "</td>"
			+ "<td class='basket-price' value='" + input.price + "'>" + "&pound" + newPrice + "</td>"
			+ "<td class='basket-count'>" + "<input type='text' value='" + input.quantity + "' readonly> " +"</input>" + "</td>"
			+ "<td class='basket-del'>" + "<button>" + "X" + "</button>" + "</td>" + "</tr>");
	// Calls loadTotal and gives it the price of the item being read
	loadTotal(parseFloat(input.price));
}

// Calculates the basket total on load, using the items in localStorage
function loadTotal(inputPrice) {
	// Total price is equal to the existing totalPrice + the new items price
	totalPrice = parseFloat(totalPrice + inputPrice);
	// Changes the basket total text to the new TotalPrice
	$("#basket-total").html("&pound" + Math.abs(totalPrice.toFixed(2)));
}