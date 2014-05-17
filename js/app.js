
(function () {
	"use strict";

	// メモ画面を隠す
	//$("#view-edit").hide();

	function showViewList() {
		//viewList.$el.show();
		//viewEdit.$el.hide();
		viewList.$el.removeClass( "left" );
		viewList.$el.addClass( "current" );

		viewEdit.$el.removeClass( "current" );
		viewEdit.$el.addClass( "right" );
	}
	
	function showViewEdit() {
		//viewList.$el.hide();
		//viewEdit.$el.show();
		viewList.$el.removeClass( "current" );
		viewList.$el.addClass( "left" );

		viewEdit.$el.removeClass( "right" );
		viewEdit.$el.addClass( "current" );
	}

	// メモのモデル
	var MemoItemModel = Backbone.Model.extend({
		defaults : {
			"memo" : "",
			"updateDate" : new Date()
		},
		initialize: function() {
		},
	});

	// メモのコレクション
	var MemoCollection = Backbone.Collection.extend({
		model : MemoItemModel 
	});
	//var memoCollection = new MemoCollection();
	var memoCollection;


	// メモアイテム
	var MemoItem = Backbone.View.extend({
		tagName : 'li',
		
		attributes : {
			"data-id" : 0
		},
		
		events : {
			"click" : "clicked"	
		},

		// クリックされた時の処理
		clicked : function() {
			//console.log( "clicked list-memo:"+this.$el.attr("data-id") );
			
			var id = this.$el.attr( "data-id" );

			// 編集モード
			viewEdit.setTitle( "メモの編集", id );
			
			var obj = memoCollection.at( id );
			
			$("#view-edit-content").val( obj.get( "memo" ));
			
			showViewEdit();	

			$("#view-edit-content").focus();
		},
	});


	// リスト画面
	var ViewList = Backbone.View.extend({
	
		el : "#view-list",
		
		initialize : function() {
			memoCollection = new MemoCollection();

			this.$( "#view-list-memo" ).html("");
			
			this.loadAll();
		},

		events : {
			"click #view-list-header-add" : "add_clicked",
		},
		
		add_clicked : function() {
			viewEdit.setTitle( "新しいメモ", -1 );
			showViewEdit();
			
			$("#view-edit-content").focus();
		},
		
		saveAll : function( updateAll ) {
			//console.log( "saveAll:"+JSON.stringify( memoCollection ));
		
			localforage.clear();
			if( updateAll == 1 ) {
				localforage.setItem( "memo", JSON.stringify( memoCollection ),
					function( result ) {
						//console.log(result);
						viewList.updateAll();
					});
			} else {
				localforage.setItem( "memo", JSON.stringify( memoCollection ), null );
			}
		},
		
		loadAll : function() {
			localforage.getItem( "memo",
				function( result ) {
					var obj = JSON.parse( result );
					
					//console.log( "obj-count:"+obj.length );
					
					for( var i=0; i<obj.length; i++ ) {
						//var item = new MemoItemModel();
						
						//item.set( "text", obj.get("text"));
						//item.set( "updateDate", new Date( obj.get("updateDate") ));
						//console.log( obj[i].get("text"));
						//console.log( obj[i].get("updateDate") );
						//console.log( JSON.stringify( obj[i] ));
						
						var item = new MemoItemModel();
						item.set( "memo", obj[i].memo );
						item.set( "updateDate", new Date( obj[i].updateDate ));
						memoCollection.push( item );
					}
					
					viewList.updateAll();
				});

		},
		
		addItem : function( obj, i ) {
			var elem;
			var str = obj.get( "memo" );
			var memoItem = new MemoItem;
			
			if( str.length <= 0 ) {
				str = "新規メモ";
			}
			
			elem = "<a href='#'><p>" + str + "</p>";
			elem += "<p style='font-size:1.2rem; color:#999999'>"
				 + obj.get( "updateDate" ).toLocaleDateString()
				 + " "
				 + obj.get( "updateDate" ).toLocaleTimeString()
				 + "</p></a>";
			memoItem.$el.append( elem );
			memoItem.$el.attr( "data-id", i );
			memoItem.$el.attr( "id", "view-list-memo-item" );
			this.$( "#view-list-memo" ).append( memoItem.el );
		},
		
		editItem : function( obj, i ) {
			var elem;
			var str = obj.get( "memo" );
			
			if( str.length <= 0 ) {
				str = "新規メモ";
			}
			
			elem = "<a href='#'><p>" + str + "</p>";
			elem += "<p style='font-size:1.2rem; color:#999999'>" + obj.get( "updateDate" ).toLocaleDateString() + "</p></a>";
			this.$( "#view-list-memo-item" )[i].innerHTML = elem;
		},
		
		updateAll : function() {
			var max = memoCollection.length;
						
			// 一旦クリアする
			this.$( "#view-list-memo" ).html("");
			for( var i=0 ; i < max ; i++){
				//var memoItem = new MemoItem;
				var obj = memoCollection.at( i );
				
				this.addItem( obj, i );
			/*
				var elem;
				var str = obj.get( "memo" );
				if( str.length <= 0 ) {
					str = "新規メモ";
				}
				
				//elem = "<a href='#'><p>" + obj.get( "memo" ) + "</p></a>";
				elem = "<a href='#'><p>" + str + "</p></a>";
				memoItem.$el.append( elem );
				memoItem.$el.attr( "data-id", i );
				this.$( "#view-list-memo" ).append( memoItem.el );
			*/
			}
			
		},
		
	});	
	var viewList = new ViewList;


	// 編集画面
	var ViewEdit = Backbone.View.extend({
	
		el : "#view-edit",
		
		attributes : {
			"data-edit-index" : -1
		},
			
		initialize : function() {
			$( "#view-edit-header-delete" ).hide();
			$( "#view-edit-delete-dialog" ).hide();
		},

		events : {
			"click #view-edit-header-back" : "clicked_back",
			"click #view-edit-header-delete" : "clicked_delete",
			
			"click #view-edit-delete-dialog-cancel" : "clicked_dialog_cancel",
			"click #view-edit-delete-dialog-yes" : "clicked_dialog_yes"
		},
		
		clicked_back : function() {
		
			var index = this.$el.attr( "data-edit-index" );
			var str = $( "#view-edit-content" ).val();
			
			if( str.length <= 0 )
			{
				showViewList();
				return;
			}
			
			if( index == -1 ) {
				var elem = new MemoItemModel();
				
				elem.set( { memo : $( "#view-edit-content" ).val(), updateDate : new Date() });
			
				memoCollection.push( elem );
				viewList.addItem( elem, memoCollection.length - 1 );
			} else {
				memoCollection.at( index ).set( { memo : $("#view-edit-content").val(), updateDate : new Date() } );

				var obj = memoCollection.at( index );
				viewList.editItem( obj, index );
			}
			viewList.saveAll( 0 );
			showViewList();
		},
		
		clicked_delete : function() {
			this.$( "#view-edit-delete-dialog" ).show();
		},
		
		clicked_dialog_cancel : function() {
			this.$( "#view-edit-delete-dialog" ).hide();
		},
		
		clicked_dialog_yes : function() {
			
			var index = this.$el.attr( "data-edit-index" );
			
			var obj = memoCollection.at( index );
			memoCollection.remove( obj );
			
			viewList.saveAll( 1 );
			showViewList();

			this.$( "#view-edit-delete-dialog" ).hide();
		},
		
		setTitle : function( title, index ) {
			//this.$( "#view-edit-header-title" ).text( title );
			this.$el.attr( "data-edit-index", index );
			
			if( index == -1 ) {
				// ツールバー
				this.$( "#view-edit-content" ).val( "" );
				this.$( "#view-edit-header-delete" ).hide();

				// サブヘッダー
				this.$( "#view-edit-update").text( "" );
				this.$( "#view-edit-update").hide();
			}
			else
			{
				// ツールバー
				this.$( "#view-edit-header-delete" ).show();
				
				// サブヘッダー
				var obj = memoCollection.at( index );
				this.$( "#view-edit-update").text(
					obj.get( "updateDate" ).toLocaleDateString() + " " + 
					obj.get( "updateDate" ).toLocaleTimeString()
				);
				this.$( "#view-edit-update").show();
			}
			
		}
	});	
	var viewEdit = new ViewEdit;

}());