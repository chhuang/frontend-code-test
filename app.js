'use strict';

$(function() {
  $.getJSON('recipes.json', function(data) {

/* ==========================================================================
    SETUP       
   ========================================================================== */

    var $filter           = $('.js-filter');
    var $recipesList      = $('<ul>', { 'class': 'list-group' });
    var $ingredientsList  = $('<ul>', { 'class': 'list-group' });
    var recipeFilter      = localStorage.recipeFilter || [];

    $('.js-recipes').append($recipesList);
    $('.js-ingredients').append($ingredientsList);


/* ==========================================================================
    INGREDIENTS       
   ========================================================================== */

    var Ingredients = {

      filter: function() {
        return $.map(data, function(item) { 
          return item.ingredients; // jQuery.map flattens all returned arrays => http://api.jquery.com/jquery.map/
        }).filter(function(item, index, arr) { // Native JS .filter, not jQuery => https://goo.gl/UWwUjt.
          return index === arr.indexOf(item);
        }).sort().map(function(item) { // Native JS .map
          return $('<option>', { text: item }); 
        });
      },

      // Expensive operation: this can be improved by updating only the necessary items instead of running through 
      // all the checkboxes everytime a checkbox is toggled.
      update: function() { 
        var ingredients = [];

        $ingredientsList.empty();

        $('.js-recipes input:checkbox').each(function() {

          var recipeName = this.nextSibling.nodeValue;
          
          if (this.checked) {
            $.map(data, function(item) {
              (item.name === recipeName) && (ingredients = ingredients.concat(item.ingredients));
            });
          } 
        });

        ingredients = ingredients.sort().filter(function(item, index, arr) {
          return index === arr.indexOf(item);
        });

        $.map(ingredients, function(item) {
          $('<li>', { text: item, 'class': 'list-group-item' }).appendTo($ingredientsList);
        });
      },

      setState: function($el) {
        var recipeStorage;

        recipeStorage = {
          name: $el.parent().text(),
          checked: $el.prop('checked')
        }

        if (typeof recipeFilter === 'string') recipeFilter = JSON.parse(recipeFilter);
        $el.prop('checked') ? recipeFilter.push(recipeStorage) : recipeFilter.pop(recipeStorage);
        localStorage.setItem('recipeFilter', JSON.stringify(recipeFilter));        
      },

      getFilterState: function() {
        $('option', $filter).filter(function() {
          return $(this).val() === localStorage.ingredientFilter;
        }).prop('selected', 'selected');  
      }
    }


/* ==========================================================================
    RECIPES  
   ========================================================================== */

    var Recipes = {

      load: function(ingredientFilter) {
        
        var recipesFiltered = [];
        $recipesList.empty(); // Clear HTML 
        
        $.map(data, function(item) {
          (ingredientFilter && $.inArray(ingredientFilter, item.ingredients) !== -1) && recipesFiltered.push(item.name); // Push only filtered recipes
          (!ingredientFilter || ingredientFilter === 'Any ingredient') && recipesFiltered.push(item.name); // Push all recipes
        });

        return recipesFiltered
                .sort()
                .map(function(item) {
                  return  $recipesList.append(
                          $('<li>', { text: item, 'class': 'list-group-item' }).prepend(
                            $('<input>', { 'class': 'pull-right', 'type': 'checkbox' })
                          )
                        )  
        });
      },

      getState: function() {
        $.map(JSON.parse(localStorage.recipeFilter), function(item) {
          $(':checkbox', $recipesList).filter(function() {
            (this.nextSibling.nodeValue === item.name) && $(this).prop('checked', 'checked');
          });
        })
        Ingredients.update();
      }
    };

    /* CREATE SELECT DROPDOWN */
    $filter.append(
      $('<select>', { html: Ingredients.filter() })
        .prepend($('<option>', { text: 'Any ingredient', 'class': 'all' }))
    );

    /* LOAD INGREDIENTS INTO OPTIONS */
    $('select', $filter).change(function() {
      var $ingredient = $('option:selected', this).val();

      if ($('option:selected', this).val() === 'Any ingredient') {
        Recipes.load();  
      } else {
        Recipes.load($ingredient);  
      }

      // localStorage
      (localStorage.recipeFilter) && Recipes.getState();
      localStorage.setItem('ingredientFilter', $ingredient);
    });

    /* TOGGLE INGREDIENT BY RECIPES */
    $(document).on('change', '.js-recipes input:checkbox', function() {
      var $this = $(this);

      Ingredients.update();
      Ingredients.setState($this);
    });
    
    /* INITIAL LOAD */
    Recipes.load(localStorage.ingredientFilter); // Load all recipes or based on selected ingredient
    (localStorage.ingredientFilter) && Ingredients.getFilterState(); // Retrieve filter state (also reload recipes)
    (localStorage.recipeFilter) && Recipes.getState(); // Check recipes based on localStorage (also update ingredients)
  }); 
})