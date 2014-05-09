;(function () {
	var app = window.app = window.app || {};
	var api = 'https://app.likeastore.com/api';

	var MainView = function (block) {
		var self = this;
		var logo = chrome.extension.getURL("img/logo.png");

		self.$ = $('\
			<div class="ls-search">\
				<div class="logo">\
					<a href="https://likeastore.com">\
						<img src="' + logo +'" alt="likeastore.com" style="width: 180px" />\
					</a>\
				</div>\
				<div class="ls-container"><div class="ls-loader"></div></div>\
			</div>');

		self.render = function () {
			block.prepend(self.$);
			return self;
		};

		self.subview = function(view) {
			self.$.find('.ls-container').html(view.render().$);
		};
	};

	var LoginView = function () {
		var self = this;
		self.$ = $('<div class="ls-login"></div>');

		self.render = function () {
			self.$.html('<a href="https://likeastore.com/login" target="_blank">Log In</a> or <a href="https://likeastore.com/login" target="_blank">Create Account</a> to search your likes.');
			return self;
		};
	};

	var ResultsView = function (results) {
		var self = this;

		var context = results.data.map(function (item) {
			return {
				title: item.title || item.repo || item.name || item.authorName,
				description: item.description,
				source: item.source,
				thumbnail: item.thumbnail,
				date: new Date(item.date).toLocaleDateString()
			};
		});

		var searchResults = '\
			{{data}}\
				<li class="item">\
					<a href={{source}} class="ls-title">{{title}}</a>\
					<div class="ls-link">\
						<a href={{source}}>{{source}}</a>\
					</div>\
					<div class="ls-description">{{description|tease>21}}</div>\
					<div class="ls-date">\
						You\'ve favorited this page on {{date}}\
					</div>\
				</li>\
			{{/data}}\
			<li class="ls-more">\
				Not found yet? Visit web site for <a href="{{more}}">more</a> results.\
			</li>\
		';

		var searchEmpty = '\
			<p>Sorry, nothing found for this query.</p>\
		';

		self.$ = $('<ul class="ls-results"></ul>');

		self.render = function () {
			var template = context.length > 0 ? searchResults : searchEmpty;
			var text = app.searchQuery();

			var more = 'https://app.likeastore.com/search?text=' + encodeURI(text);
			var content = Mark.up(template, {data: context, more: more});

			self.$.html(content);
			return self;
		};
	};

	var App = function (block) {
		var user = function () {
			return $.get(api + '/users/me');
		};

		var login = function () {
			var mainView = new MainView(block);
			mainView.subview(new LoginView());
			mainView.render();
		};

		var haveResults = function (fn) {
			return function (res) {
				res && res.length > 0 && fn(res);
			};
		};

		var results = function (res) {
			var mainView = new MainView(block);
			mainView.subview(new ResultsView(res));
			mainView.render();
		};

		var search = function () {
			var text = app.searchQuery();

			$.get(api + '/search?text=' + text + '&pageSize=10')
				.done(haveResults(results))
				.fail(login);
		};

		return {
			run: function () {
				user()
					.done(search)
					.fail(login);
			}
		};
	};

	$('#rhs').waitUntilExists(function () {
		new App($(this)).run();
	});

})();