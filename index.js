'use strict';

const isPlainObject = require('lodash.isplainobject');

function isDate(d){
  return Object.prototype.toString.call(d) === "[object Date]" && !isNaN( d.getTime() );
}

module.exports = {
  check: check
};

function check(user, comparisons, match_type, array_attributes = []) {

  match_type = match_type || "and";

  function like(str, search) {
    if (typeof search !== 'string' || str === null) {return false; }
    // Remove special chars
    search = search.replace(new RegExp("([\\.\\\\\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])", "g"), "\\$1");
    // Replace % and _ with equivalent regex
    search = search.replace(/%/g, '.*').replace(/_/g, '.');
    // Check matches
    return RegExp('^' + search + '$', 'gi').test(str);
  }

  var comparisons;
  var test;
  var result = false;

  if (isPlainObject(comparisons)) {
    match_type = (comparisons.search_type == 'any') ? 'or' : 'and';
    if (comparisons.user_role == "user") {
      if (user.is_anonymous)
        return false;
    } else {
      if (!user.is_anonymous)
        return false;
    }
    comparisons = comparisons.items;
  }

  for (var i in comparisons) {
    let comparison = comparisons[i];
    let test = null;

    // TODO: make more safely

    if (comparison.type == 'or') {
      result = result || check(user, comparison.comparisons, "or", array_attributes);
      break;
    }

    let data;
    let attrArr = comparison.attribute.split('.');
    if (attrArr.length > 1){
      if (attrArr.length > 2){
        if (user[ attrArr[0] ] && user[ attrArr[0] ][ attrArr[1] ]) {
          data = user[ attrArr[0] ][ attrArr[1] ][ attrArr[2] ];
        }
      } else {
        if (user[ attrArr[0] ]) {
          data = user[ attrArr[0] ][ attrArr[1] ];
        }
      }
    } else {
      data = user[ comparison.attribute ];
    }

    if (array_attributes.indexOf(comparison.attribute) > -1) {

      if (!_.isArray(data)){
        test = false;
      } else {
        data = data.map(id => id.toString());

        if (comparison.comparison == 'eq'){
          test = data.indexOf(comparison.value) > -1;
        } else
        if (comparison.comparison == 'ne'){
          test = data.indexOf(comparison.value) < 0;
        } else {
          test = false;
        }
      }

      if (match_type == "and"){
        if (!test)
          return false;
        else
          continue;
      } else {
        result = result || test;
        continue;
      }

    }

    if (['contains', 'starts_with', 'ends_with', 'not_contains', 'like'].indexOf(comparison.comparison) > -1)
      if (data)
        data = String(data);
      else
        data = '';

    if (['known', 'unknown'].indexOf(comparison.comparison) < 0 && comparison.type == 'date'){
      try {
        comparison.value = new Date(comparison.value);
        if (!comparison.value){
          comparison.value = null;
          test = false;
        }
      } catch (e) {
        comparison.value = null;
        test = false;
      }
    }

    switch (comparison.comparison){
    case 'eq':
      if (comparison.type == 'date') {
        if (isDate(comparison.value)) {
          test = (data >= new Date(comparison.value.getFullYear(), comparison.value.getMonth(), comparison.value.getDate()))
            && (data < new Date(comparison.value.getFullYear(), comparison.value.getMonth(), comparison.value.getDate() + 1));
        } else {
          test = false;
        }
      } else
        test = data == comparison.value;
      break;
    case 'lt':
      test = data < comparison.value;
      break;
    case 'lte':
      test = data <= comparison.value;
      break;
    case 'gt':
      test = data > comparison.value;
      break;
    case 'gte':
      test = data >=  comparison.value;
      break;
    case 'ne':
      test = data !=  comparison.value;
      break;
    case 'like':
      test = like(data, comparison.value);
      break;
    case 'contains':
      test = data.toLowerCase().indexOf(comparison.value.toLowerCase()) > -1;
      break;
    case 'starts_with':
      test = data.toLowerCase().indexOf(comparison.value.toLowerCase()) == 0;
      break;
    case 'ends_with':
      test = data.toLowerCase().indexOf(comparison.value.toLowerCase()) == (data.length - predicate.value.length);
      break;
    case 'not_contains':
      test = data.toLowerCase().indexOf(comparison.value.toLowerCase()) < 0;
      break;
    case 'unknown':
      test = (typeof data == 'undefined') || (data == null);
      break;
    case 'known':
      test = !((typeof data == 'undefined') || (data == null));
      break;
    case 'in':
      test = _.isArray(data) && data.indexOf(comparison.value) > -1;
      break;
    case 'nin':
      test = !(_.isArray(data) && data.indexOf(comparison.value) > -1);
      break;
    default:
      test = false;
    }
    if (match_type == "and"){
      if (!test)
        return false;
    } else {
      result = result || test;
    }
  }

  if (match_type == "and"){
    return true;
  } else {
    return result;
  }

}
