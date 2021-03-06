'use strict';

var app = angular.module('myApp.view4', ['ngRoute'])

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view4', {
    templateUrl: 'view4/view4.html',
    controller: 'view4Ctrl'
  });
}])
//Invoice entry. Adds invoice info and total to invoices collection. Adds line items -invArr- to transactions collection.
//or show an existing invoice
app.controller('view4Ctrl', ['$scope', '$window','$http', '$routeParams', '$location', '$filter', 'addInvoice', 'getInvoice', 'getCustomer', function($scope, $window, $http, $routeParams, $location, $filter, addInvoice, getInvoice, getCustomer){
	//if the page request has parameters, user wants to see an existing invoice
	if ( $routeParams.number )
	{
	$scope.saved = true //don't need to save before printing
	$scope.invoice = {}

	$scope.invoice.number = $routeParams.number

	$scope.invoice.date = new Date($routeParams.date)
	var invNum = parseInt( $scope.invoice.number )

		$scope.invoice.number = invNum
	var inv = { number : invNum }
	var promise = getInvoice.getInv(inv)
	promise.then( function(response){

			if (response.data)
		{
	$scope.invoice = response.data
			$scope.invoice.lines.forEach(function(currentValue, index){
				console.log(currentValue.amount)
				var str2num = Number(currentValue.amount)
				$scope.invoice.lines[index].amount = $filter('currency')(str2num, "", 2)
				console.log($scope.invoice.lines[index].amount)

			} )

			var parts = $scope.invoice.date.split('/')
		var dateObj = new Date(parts[0], parts[1], parts[2])
		$scope.invoice.date = dateObj
	$scope.invoice.address = $routeParams.address
		}
			},
	function errorCallback(err){
		console.log('error')
		alert(err.data.error)
		$location.path('/view2')


	})
	}
	//add a new invoice
	else {
	$scope.saved = false
	$scope.invoice = {}
		if ($routeParams.name)
		{
			$scope.customer = $routeParams
			$scope.invoice.name = $routeParams.name
			$scope.invoice.address = $routeParams.address
		}
	$scope.invoice.lines = [ { activity : "", memo : "", amount : "" } ]
	$scope.invoice.total = 0
	$scope.invoice.date = new Date()
	$scope.invoice.type = "Invoice"
	}	
	$scope.cancelInvoice = function(){
		$location.path('/view2')
		}
	$scope.printInvoice = function(event){
		$('md-toolbar').hide()
		$('.md-datepicker-input-container').css("border-bottom-width",  0)
		$('input').css("border-bottom-width",  0)

		$('textarea').css("border-bottom-width",  0)

		$(".menu").add('p').add('button').hide()
		var number = {number : $scope.invoice.number}
			var promise = getInvoice.getInv(number)
			promise.then(
			function successCallback(response){
				$scope.invoice = response.data
				$window.print();
				$(".menu").add('p').add('button').show()
			}, function errorCallback(response){
				alert('error' +	response.error)
			}
		)
	}
	$scope.saveInvoice = function(){

		var dtObj = $scope.invoice.date
		var month = (dtObj.getMonth() + 1).toString()
		if (month.length == 1) month = "0" + month
		var day = dtObj.getDate().toString()
		if (day.length == 1) day = "0" + day
		$scope.invoice.date =   month + '/' + day + '/' + dtObj.getFullYear()

		var length =  $scope.invoice.lines.length
		var re = /\,/g
		var amount = $scope.invoice.lines[length - 1].amount
		amount = parseFloat(amount)
		$scope.invoice.total += amount
		if ( $scope.invoice.name == null )
		{alert( 'Enter a customer name' )
			return}
		if ( $scope.invoice.number == undefined )
		{alert( 'Enter an Invoice Number to continue' )
			return}
		if ( $scope.invoice.total == 0 )
		{alert( 'Please enter an amount' )
			return}
		if ( $scope.invoice.lines[length - 1].amount == 0 )//if the last line item is empty get rid of it
		$scope.invoice.lines.pop()
		$scope.customer.invoices.push($scope.invoice)//customer collection has an array of invoices
			var promise = addInvoice.saveInv($scope.invoice)
			promise.then(function(){
				$scope.saved = true
				return $http( {url : "/customerUpdate",	method : 'POST', data : $scope.customer})
				},
				function errorCallback(response){
					console.dir(response)
				if (response.data.duplicate_error)
				alert(response.data.duplicate_error)
				}
			)
		}
	$scope.tabfwd = function( event ){
		if (event.which == 13) return
		var accept = [ 9, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57 ]	//dot, tab, and 0-9
		if ( accept.indexOf( event.which ) == -1 ) return
		if (event.which == 9)
		{
		var num = angular.element(event.target).val()
		var re = /\,/g
		var totnum = num
		totnum = totnum.replace(re, "")
		totnum = parseFloat(totnum)
		$scope.invoice.total += totnum
		$scope.invoice.lines.push( { activity : "", memo : "", amount : 0 } )
		}//if
	}
	$scope.custdetails = function(){
		$scope.invoice.name = $('#custinvoice').val()
		var params = {name : $scope.invoice.name }
		var promise = getCustomer.cust(params)
		promise.then(function(response){
			$scope.customer = response.data
			$scope.invoice.address = response.data.address
		})

	}
}])
app.factory( 'addInvoice', [ '$http', function($http) {
    return	{
	saveInv :	function(invoice) {
			return $http({url : '/newInvoice', data : invoice, method : "POST"})
		}
	}
	}])
app.factory( 'getInvoice', [ '$http', function($http) {
	return {
		getInv : function(number) {
			return	$http({method: 'GET', url: '/invoice', params: number})
		}
	}
}])
app.factory('getCustomer', ['$http', function($http){
	return {
		cust :
			function(params){
				return $http({url : '/customer', params : params, method : "GET"})
			}}
}])
app.directive('listservices', [ '$http', function($http){	
	return {
	require : 'ngModel',
	link : function(scope,element,attrs, ngModel){
		 var services = new Array		 				
		$http( {
    	url: '/services',
   	 	method: "GET"}		 
		)
		.then( function(msg){

			angular.forEach(msg.data, function( value, key){
			services[key] = value.service;
			})	
			element.autocomplete({
  				    source: services					
					})
			element.on( "autocompletechange", function(event, ui){
				var val = event.target.value
				if (services.indexOf(val) == -1 && val.length > 0 )
				{
				alert(val + ' not in list of Services')	
				angular.element(event.target).val("")
				return
				}//if
				scope.$apply(function(){
					ngModel.$setViewValue(val)
				})				
				})//autocompletechange callback		
		})//success
		}//link
	}//return
	}])//directive


