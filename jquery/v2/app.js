'use strict';

var App = App || {};

// Let's get started!
App.settings = (function($, App) { 
  /**
   * Preload all recipes
   * Using async:false here since it's a small json file, in a real world scenario 
   * where data could be much larger, the call should be async.
   * 
   * @return {Array} Array of recipes
   */
  function fetchRecipes() {
    var recipes;

    var yay = function(response) {
      recipes = response;
    };

    var nah = function() {
      console.log('Json? Are you there?');
    };

    $.ajax({
      url: '/recipes.json',
      async: false, 
      dataType: 'json', 
      success: yay,
      error: nah
    });

    return recipes
  };

  return {
    data: fetchRecipes(),
    $el: $('#app'),
    $recipesContainer: $('.js-recipes'),
    $ingredientsContainer: $('.js-ingredients'),
    $filterContainer: $('.js-filter select')
  } 
})(jQuery, App);

// Ingredients
App.ingredients = (function($, App) {
  var _removeRepeatedIngredients = function(ingredient, index, arr) {
    return index === arr.indexOf(ingredient);
  };

  var renderFilter = function() {
    // Get all ingredients from recipes
    var ingredients = App.settings.data.map(function(recipe) {
      return recipe.ingredients;
    });

    // Flatten, sort and remove repeated ingredients
    ingredients = [].concat.apply([], ingredients).sort().filter(_removeRepeatedIngredients);

    // Inject a default option for any ingredient
    App.settings.$filterContainer.prepend($('<option>', { text: 'Any ingredient', value: 'Any' }));

    var _renderIngredientOption = function(ingredient) {
      $('<option />', { text: ingredient, value: ingredient }).appendTo(App.settings.$filterContainer);
    };

    var _bindSelect = function() {
      App.settings.$filterContainer.on('change', function() {
        if (this.value === 'Any') {
          App.recipes.renderRecipes();
        } else {
          App.recipes.renderRecipes({
            savedIngredient: this.value
          });
        }

        // Reset ingredients list
        App.ingredients.renderIngredients();

        // Save it to localStorage
        App.ingredients.saveFilter(this.value);
      });
    };

    // Render the ingredients dropdown
    ingredients.map(function(ingredient) {
      _renderIngredientOption(ingredient);
    });

    // Bind filter select
    _bindSelect();

    $('.js-showAll').on('click', function() {
      App.recipes.renderRecipes();
      $('option[value="Any"]', App.settings.$filterContainer).prop('selected', true);
      App.ingredients.saveFilter('Any');

      return false;
    });
  };

  var renderIngredients = function($checkbox) {
    // Active ingredients holder
    var activeIngredients = [];

    // Clear all current ingredients in the DOM
    App.settings.$ingredientsContainer.empty();

    if ($checkbox) {
      if ($checkbox.is(':checked')) {
        // Get ingredients for the selected recipe
        var selectedIngredients = App.recipes.getRecipe($checkbox.val()).ingredients;

        // Add selected recipe's ingredients to activeIngredients, sort them and remove repeated items
        activeIngredients = activeIngredients.concat(selectedIngredients).sort().filter(_removeRepeatedIngredients);

        // Update UI
        $checkbox.closest('label').addClass('is-selected');
      } else {
        $checkbox.closest('label').removeClass('is-selected');
      }
    }
    
    // Put the ingredients in the UI
    if (activeIngredients.length > 0) {
      activeIngredients.map(function(ingredient) {
        $('<li />', { text: ingredient, 'class': 'list-group-item' }).appendTo(App.settings.$ingredientsContainer);
      });

      $('.js-emptyHolder').hide();
    } else {
      $('.js-emptyHolder').show();
    }
  };

  // Save ingredient filter
  var saveFilter = function(ingredient) {
    localStorage.setItem('savedIngredient', ingredient);
  };

  // Load selection from localStorage if any
  var loadFilter = function() {
    var savedIngredient = localStorage.savedIngredient;
    renderFilter();

    if (savedIngredient && savedIngredient !== 'Any') {
      // Saved ingredient should be selected
      $('option[value="' + savedIngredient + '"]', App.settings.$filterContainer).prop('selected', true);
      
      App.recipes.renderRecipes({
        savedIngredient: savedIngredient
      });
    } else {
      App.recipes.renderRecipes();
    }
  };

  return {
    renderIngredients: renderIngredients,
    renderFilter: renderFilter,
    saveFilter: saveFilter,
    loadFilter: loadFilter
  }
})(jQuery, App);

// Recipes
App.recipes = (function($, App) {
  /**
   * Display the recipes
   * @param  {Object} options { savedIngredient: {String} } 
   * @return {Nope}
   */
  var renderRecipes = function(options) {
    // Default to show all recipes
    var recipes = App.settings.data;

    // Clear all current recipes in the DOM
    App.settings.$recipesContainer.empty();

    // Filter recipes if an ingredient is passed in
    if (options && options.savedIngredient) {
      recipes = App.settings.data.filter(function(recipe) {
        return _hasIngredient(options.savedIngredient, recipe.ingredients);
      });
    }

    var _bindCheckbox = function() {
      $(':checkbox', App.settings.$recipesContainer).on('change', function() {
        var $this = $(this);

        App.ingredients.renderIngredients($this);

        if ($this.is(':checked')) {
          saveRecipes($this.val())
        }
      });
    };

    // Sort the recipes before displaying them
    recipes.sort(function(a, b) {
      return a.name > b.name
    });

    // Fugly DOM manipulation in here
    recipes.map(function(recipe) {
      $('<label />', { text: recipe.name, 'class': 'list-group-item list-group-item-action', 'href': '#' })
        // Checkbox
        .prepend($('<input>', { 'class': 'pull-xs-right hidden-xs-up', 'type': 'checkbox', value: recipe.name }))

        // Recipe's type
        .prepend($('<span />', { 'class': 'tag tag-danger pull-xs-right', text: recipe.type }))

        // Recipe's cook time
        .prepend($('<span />', { 'class': 'tag tag-success pull-xs-right', text: recipe.cook_time + ' mins' }))
        .appendTo(App.settings.$recipesContainer);
    });

    _bindCheckbox();
  };

  /**
   * Get a recipe by name
   * @param  {String} name (The recipe's name)
   * @return {Object} (The recipe)
   */
  var getRecipe = function(name) {
    return App.settings.data.filter(function(recipe) {
      return recipe.name === name;
    })[0];
  };

  /**
   * Check if a recipe contains a specific ingredient
   * @param  {String} ingredient 
   * @param  {Array} recipe     
   * @return {Boolean}            
   */
  var _hasIngredient = function(ingredient, recipe) {
    return recipe.indexOf(ingredient) > -1;
  };

  return {
    renderRecipes: renderRecipes,
    getRecipe: getRecipe
  }
})(jQuery, App);

App.init = function() {
  App.ingredients.loadFilter();
};

// Initialise on DOM ready
$(function() {
  App.init();
});
