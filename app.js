/*
App to do list:
1. Add budget items
- Button exists for adding item. Add event listener
- Get important info from container for making budget item
- Add budget item to data structure
- Update budget income/expenses and update budget
- Update user interface to show added budget


Budget Model
Maintains data structures for budget, income items, and expense items
Holds budget items, and budget amount

UI Controller 
Updates UI elements
Gathers info from UI elements

Event Controller
Handles Events
Manages Event listeners

*/

//Shortcut function for document.querySelector(selector)
var qs = function(ele) {
	return document.querySelector(ele);
}

var BudgetModel = (function(){
	
	var data = {
		//Remaining budget in decimal amount
		budget: 0,
		//Remaining budget in percentage
		percentage: null,
		
		//Arrays of Expense and Income objects
		items: {
			inc: [],
			exp: [],
		},
		//Budget Item Totals
		totals: {
			inc: 0,
			exp: 0,
		},
	};
	
	/*
	* Creates an expense item from a given description, amount, and id number. Sets a 
	* starting percentage value to -1;
	*/
	var Expense = function(desc, amount, id){
		this.description = desc;
		this.amount = amount;
		this.id = id;
		this.percentage = -1;
	};
	
	Expense.prototype.updatePercentage = function(totalIncome){
		if(totalIncome > 0){
			this.percentage = Math.round((this.amount / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};
	
	//Creates an income item from a given description, amount, and id number
	var Income = function(desc, amount, id){
		this.description = desc;
		this.amount = amount;
		this.id = id;
	}
	
	/*
	* Loops through either all of the income or expense items, sums the amounts of each item, 
	* and saves the value into the appropriate totals variable
	*/
	var updateTotal = function(type){
		if(type !== "inc" && type !== "exp") {
			console.log("ERROR: Given invalid type for BudgetModel.updateTotal. FOUND: " + type);
			return null;
		}
		var result = 0;
		
		data.items[type].forEach(function(item, i, arr) {
			result += item.amount;
		});
		data.totals[type] = result;
	}
	
	return {
		//Properties
		
		//Methods
		/*
		* Adds an item to the budget model using the given type, description, and amount. Returns the 
		* added budget item if the item is succesfully created. Returns a null if the given item has
		* an invalid type or amount and the method prints an error message to the console.
		*/
		addItem: function(type, description, amount){			
			var newItem, newId;

			/*
			* If no items in items.exp or items.inc, newId = 0. 
			* Else newId = (last ID in the inc or exp array) + 1
			*/
			newId = (data.items[type][0] === undefined) ? 0 : data.items[type][data.items[type].length - 1].id + 1;
			
			if(type === "inc") {
				newItem = new Income(description, amount, newId);
			} else if (type === "exp") {
				newItem = new Expense(description, amount, newId);
			} else {
				console.log("ERROR: Did not find a correct type. FOUND: " + type);
				return null;
			}
			
			/*
			May be obsolete due to error checking in UIController.getItemInfo;
			else {
				console.log("ERROR: Attempted to add item with invalid type. Found: " + item.type);
				return null;
			} if (amount === null || amount === NaN){
				console.log("ERROR: Attempted to add number with NaN or null value. Found: " + item.value);
				return null;
			}
			*/
			
			data.items[type].push(newItem);
			data.totals[type] += newItem.amount;
			
			return newItem;
		},
		
		/*
		* Deletes and returns an item from the budget according to a given id and item 
		* type. Returns null if the item id given is not find.
		*/
		deleteItem: function(type, id){
			//Find correct index first.
			var ids = data.items[type].map(function(current){
				return current.id;
			});
			//console.log("ids = " + ids);
			var index = ids.indexOf(id);
			//console.log("index = " + index);
			if(index > -1) {
				return data.items[type].splice(index, 1);
			} else {
				return null
			}
		},
		
		/*
		* Calculates the incomes and expenses, the total budget,
		* and the percentage of income spent.
		*/
		calculateBudget: function(){
			updateTotal("inc");
			updateTotal("exp");
			
			data.budget = data.totals.inc - data.totals.exp;
			if(data.totals.inc > 0) {
				data.percentage = Math.round((data.totals.exp/data.totals.inc) * 100);
			} else{
				data.percentage = -1;
			} 			
		},
		
		/*
		* Calculates the percentage of the budget used. Also calculates the 
		* percentage of the budget used for each Expense object.
		*/
		calculatePercentages: function(){
			data.items.exp.forEach(function(current, index){
				current.updatePercentage(data.totals.inc);
				//console.log(index + " = " + current.percentage);
			});
		},
		
		//Returns the total income, total expenses, and percentage of total budget used
		getBudget: function(){
			return {budget: data.budget, 
			income: data.totals.inc, 
			expense: data.totals.exp,
			percentage: data.percentage,
			};
		},
		
		/*
		* Returns an array containing a list of percentages used. The percentages in the
		* array are in the same order as the budget. i.e. index 0 refers to the first 
		* element in the budget, index 1 refers to the second element in the budget and so on.
		*/
		getPercentages: function(){
			return data.items.exp.map(function(current){
				return current.percentage;
			})
		},
		
		//Returns the data variables of the BudgetModel for reading
		getData: function() {
			console.log(data);
		},
	}
})();



var UIController = (function(){
	/*
	* Item object for representing a budget item. Budget items have a type 
	* (whether it is an income or expense), a description, and an amount. 
	* The constructor will use the Number() function in an attempt to 
	* convert a given amount input into a number. amount is set to NaN,
	* if Number fails to convert the given string
	*
	* Item info is stored in an appropriately named property. ("type" for 
	* item type; "description" for the item's description; "amount" for 
	* the item's amount)
	*/
	function Item(type, description, amount) {
		this.type = type;
		this.description = description;
		this.amount = amount;
	}

	// Object container for all DOM element class strings in index.html
	var DOMstrings = {
		budgetTotal: ".budget__value",
		budgetItemList: ".container",
		budgetPercentage: ".budget__expenses--percentage",
		
		expensesList: ".expenses__list",
		expensesPercentage: ".item__percentage", 
		expensesTotal: ".budget__expenses--value",
		
		incomeList: ".income__list",
		incomeTotal: ".budget__income--value",
		
		inputAmount: ".add__value",
		inputButton: ".add__btn",
		inputDesc: ".add__description",
		inputType: ".add__type",
		
		monthLabel: ".budget__title--month",
	}
	
	/*
	* Given a Number number and a String type, this function creates and returns 
	* a formated String number according to the following rules:
	* 1. If the given type is 'inc', then the number will start with a '+'. 
	*	 If the given type is 'exp', then the number will start with a '-'. 
	* 2. The number will have a comma every three digit places. EX. If given 
	* 	 1000000, the resulting String number will look like 1,000,000
	* 3. The number will be rounded to two decimal places and will show those
	* 	 two decimal places. EX. 100 becomes 100.00, 54.687 becomes 54.69.
	*
	* Returns the formatted String, or null if given an invalid type;
	*/
	var formatNumber = function(number, type){
		if(type !== "inc" && type !== "exp") {
			console.log("ERROR: Invalid type given to UIController.formatNumber(); Found: " + type);
			return null;
		}
		number = Math.abs(number);
		number = number.toFixed(2);
		var split = number.split(".");
		var ints = split[0];
		
		if(ints.length > 3){
			var temp = ints;
			for (var pos = ints.length - 3; pos > 0; pos -= 3) {
				temp = temp.substr(0, pos) + "," + temp.substr(pos, temp.length - pos);
			}
		ints = temp;
		}
		return ((type === "inc" ? "+" : "-") + " " + ints + "." + split[1]);
	};
	
	var nodeForEach = function(list, callback) {
		for(var i = 0; i < list.length; i++) {
			callback(list[i], i, list);
		}
	};
	
	return {
		/*
		* Takes in an Income/Expense object and type information, creates a new HTML string 
		* to represent that info, and adds that string to the Document in the correct Item location.
		* Returns the newly created HTML string, or null if the type is not valid
		*/
		addListItem: function(obj, type){
			var elementHTML, list;
			
			if(type ==="inc") {
				list = qs(DOMstrings.incomeList);
				elementHTML = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%amount%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			} else if (type ==="exp"){
				list = qs(DOMstrings.expensesList);
				elementHTML = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%amount%</div><div class="item__percentage">%percent%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
				if(obj.percentage >= 0) {
					elementHTML = elementHTML.replace("%percent%", obj.percentage);
				} else {
					elementHTML = elementHTML.replace("%percent%", "---");
				}
				
			} else {
				console.log("ERROR: Provided invalid type in UIController.addListItem(); FOUND: " + type);
				return null;
			}
			elementHTML = elementHTML.replace("%id%", obj.id);
			elementHTML = elementHTML.replace("%description%", obj.description);
			elementHTML = elementHTML.replace("%amount%", formatNumber(obj.amount, type));
			
			list.insertAdjacentHTML("beforeend", elementHTML);
			return elementHTML;
		},
		
		/*
		* Clears the item input fields for adding a new income or expense, and changes the keyboard cursor
		* to focus on the item description field.
		*/
		clearFields: function(){
			var fields = document.querySelectorAll(DOMstrings.inputDesc + ", " + DOMstrings.inputAmount);
			fields.forEach(function(val, i, list){
				val.value = "";
			});
			fields.item(0).focus();
		},
		
		changedType: function(){
			var fields = document.querySelectorAll(DOMstrings.inputType + "," + 
			DOMstrings.inputDesc + "," +
			DOMstrings.inputAmount);
			
			nodeForEach(fields, function(current){
				current.classList.toggle("red-focus");
			});
			
			qs(DOMstrings.inputButton).classList.toggle("red");
		},
		
		/*
		* Removes a list item from the UI when given an HTML selector id. Returns 
		* the removed item when 
		*/
		deleteListItem: function(selectorId){
			var child = document.getElementById(selectorId);
			try {
				return child.parentNode.removeChild(child);
			} catch (err) {
				console.log(err.message);
				return null;
			}
		},
		
		/*
		* Returns an Item object which contains the info for an Item being added to the budget. Info
		* included is a String type, a String description, and a Number amount.
		*/
		getItemInfo: function (){
			var type, desc, amount;
			type = qs(DOMstrings.inputType).value;
			desc = qs(DOMstrings.inputDesc).value;
			amount = parseFloat(qs(DOMstrings.inputAmount).value);
			if((type != "inc" && type != "exp") || desc === "" || isNaN(amount) || amount < 0 ) {
				return null;
			}
			
			var item = new Item (type, desc, amount);
			return item;
		},
		
		/*
		* Returns the an object containing the DOM reference class and ID strings that this
		* UIController uses.
		*/
		getDOMstrings: function(){
			return DOMstrings;
		},
		
		/*
		* Resets the Budget item input fields to their initial values. The item type
		* is set to "inc", the input amount is set to an empty string, and the input 
		* description is set to empty string.
		*/
		resetFields: function(){
			qs(DOMstrings.inputAmount).value = "";
			qs(DOMstrings.inputType).value = "inc";
			qs(DOMstrings.inputDesc).value = "";
		},
		
		/*
		* Takes in an object containing at least the total budget, budget income, budget expenses,
		* and budget used percentage. The UI is updated to represent the values given.
		*/
		updateBudgetHTML: function(budgetData){
			/*
			var str;
			if (budgetData.budget > 0) {
				str = "+" + budgetData.budget;
			} else {
				str = budgetData.budget;
			}
			*/
			var type = ((budgetData.budget >= 0) ? "inc" : "exp");
			qs(DOMstrings.budgetTotal).textContent = formatNumber(budgetData.budget, type)
			qs(DOMstrings.incomeTotal).textContent = formatNumber(budgetData.income, "inc");
			qs(DOMstrings.expensesTotal).textContent = formatNumber(budgetData.expense, "exp");
			
			if (budgetData.percentage > 0) {
				qs(DOMstrings.budgetPercentage).textContent = budgetData.percentage + "%";
			} else {
				qs(DOMstrings.budgetPercentage).textContent = "---";
			}			
		},
		
		/*
		* Updates the Expenses' percentages using the passed in array of percentage values.
		*/
		updatePercentages: function(percentages){
			var expPerc = document.querySelectorAll(DOMstrings.expensesPercentage);
			
			nodeForEach(expPerc, function(value, index, listObj){
				if(percentages[index] >= 0) {
					value.textContent = percentages[index] + "%";
				} else {
					value.textContent = "---";
				}
			});			
		},
	
		/*
		* Update the HTML to show the current month and year.
		*/
		updateDate: function(){
			var now = new Date();
			var year = now.getFullYear();
			var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			qs(DOMstrings.monthLabel).textContent = months[now.getMonth()] + " " + year;
		},
	}
})();



var AppController = (function(BudMdl, UICntr){
	var setUpEventListeners = function(){
		var DOMstrings = UICntr.getDOMstrings();
		
		//Add Budget item Click event listener
		qs(DOMstrings.inputButton).addEventListener("click", ctrlAddItem);
		
		//Enter Keypress handler for input box
		document.addEventListener("keypress", function(event){
			if(event.key === "Key" || event.keyCode === 13 || event.which === 13) {
				ctrlAddItem();
			}		
		});
		
		//Delete Budget item button Click event listener
		qs(DOMstrings.budgetItemList).addEventListener("click", ctrlDeleteItem)
		
		//Change input item Change event listener
		qs(DOMstrings.inputType).addEventListener("change", UICntr.changedType)
	}
	
	/*
		Add a budget item to the budget model and UI.
		Steps taken
		- Get input info from budget item fields for making budget item
		- Creates and adds the budget item to the budget model
		- Update budget model
		- Update user interface to reflect additions to budget model
	*/
	
	var ctrlAddItem = function(){
		//console.log("Output");
		var input = UICntr.getItemInfo();
		if(input === null) {
			return;
		}
		UICntr.clearFields();
		//console.log(res);
		var newItem = BudMdl.addItem(input.type, input.description, input.amount);
		UICntr.addListItem(newItem, input.type);
		updateBudget();
		updatePercentages();
	};
	
	/*
	* Deletes a selected budget item from the budget model, from the user interface,
	* and updates the budget to reflect the changes.
	* Returns null if item to remove wasn't found or doesn't exist 
	*/
	var ctrlDeleteItem = function(event){
		var result;
		//Getting Button element instead of i element when clicking on delete button
		if (String.toLowerCase(event.target.nodeName) === "i") {
			result = event.target.parentNode.parentNode.parentNode.parentNode.id; 
		} else if (String.toLowerCase(event.target.nodeName) === "button") {
			result = event.target.parentNode.parentNode.parentNode.id; 
		} else {
			//console.log("Note: You did not click on a delete button");
			return null;
		}
		
		if(result){
			var splitId = result.split("-");
			//console.log("splitID = " + splitId);
			var type = splitId[0];
			var id = parseInt(splitId[1]);
			//console.log("Deleted = ");
			BudMdl.deleteItem(type,id)
			UICntr.deleteListItem(result);
			updateBudget();
			updatePercentages();
		} else {
			console.log("ERROR: Found invalid id or type. FOUND: id = " + id + "; type = " + type + ";" );
			return null;
		}
		
	}
	
	/*
	* Calculates the budget from existing budget items, updates the UI, and returns the results of the
	* budget calcuations.
	*/
	var updateBudget = function(){
		BudMdl.calculateBudget();
		var budget = BudMdl.getBudget();
		UICntr.updateBudgetHTML(budget);
		//console.log(budget);
	};
	
	/*
	* Recalculates the percentages of the budget, updates the budget, and updates the
	* UI.
	*/
	var updatePercentages = function(){
		BudMdl.calculatePercentages();
		var result = BudMdl.getPercentages();
		console.log(result);
		UICntr.updatePercentages(result);
	}
	
	return {
		init: function(){
			UICntr.updateBudgetHTML({budget: 0, 
			income: 0, 
			expense: 0,
			percentage: 0,
			});
			setUpEventListeners();
			UICntr.resetFields();
			UICntr.updateDate();
		},
	}
	
})(BudgetModel, UIController);

AppController.init();