/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var Strings                   = brackets.getModule("strings"),
        EventDispatcher           = brackets.getModule("utils/EventDispatcher"),
        ExtensionManager          = brackets.getModule("extensibility/ExtensionManager"),
        registry_utils            = brackets.getModule("extensibility/registry_utils"),
        InstallExtensionDialog    = brackets.getModule("extensibility/InstallExtensionDialog"),
        ExtensionManagerView      = brackets.getModule("extensibility/ExtensionManagerView").ExtensionManagerView,
        itemTemplate              = require("text!templates/team-extension-manager-view-item.html"),
        Async = brackets.getModule("utils/Async");

    var TeamExtensions = require("TeamExtensions");

    /**
     * Creates a view enabling the user to install and manage extensions. Must be initialized
     * with initialize(). When the view is closed, dispose() must be called.
     * @constructor
     */
    function TeamExtensionManagerView() {
    }
    
    TeamExtensionManagerView.prototype = Object.create(ExtensionManagerView.prototype);
    TeamExtensionManagerView.prototype.constructor = TeamExtensionManagerView;
    
    TeamExtensionManagerView.prototype.initialize = function (model) {
        var self = this,
            result = new $.Deferred();
        this.model = model;
        this._itemTemplate = Mustache.compile(itemTemplate);
        this._itemViews = {};
        this.$el = $("<div class='extension-list tab-pane' id='" + this.model.source + "'/>");
        this._$emptyMessage = $("<div class='empty-message'/>")
            .appendTo(this.$el);
        this._$infoMessage = $("<div class='info-message' />")
            .appendTo(this.$el);
        
        var $container = $("<div />");
        $container.appendTo(this._$infoMessage);
        
        var $containerLeftColumn = $("<div />");
        $containerLeftColumn.css({ float: "left", width: "80%" });
        $containerLeftColumn.appendTo($container);
        
        var $containerRightColumn = $("<div />").css({ textAlign: "right" });
        $containerRightColumn.css({ float: "right" });
        $containerRightColumn.appendTo($container);
        
        var $manage = $("<a href='#team-manage'>manage</a>")
            .click(function () {
                TeamExtensions.manageExtensions();
            });
        
        $containerLeftColumn.append("<span>Install your team extensions by using Install All.  Click to </span>");
        $containerLeftColumn.append($manage);
        $containerLeftColumn.append("<span> your extensions at any time, and they are saved per-project for sharing via source control.</span>");

        $('<button id="team-install-all" class="btn primary" href="#team-install-all">Install All</button>')
            .appendTo($containerRightColumn)
            .click(function () {
                console.log('clicked');
                TeamExtensions.getExtensionsId()
                    .then(function (extensionsId) {
                        return Async.doSequentially(extensionsId, function (extensionId) {
                            var extensionRecord = ExtensionManager.extensions[extensionId];
                            var extensionVersion = extensionRecord.registryInfo.metadata.version;
                            var extensionURL = ExtensionManager.getExtensionURL(extensionId, extensionVersion);
                            return InstallExtensionDialog.installUsingDialog(extensionURL);
                        });
                    })
                    .done(function () {
                        console.log("Extensions Installed");
                    });
            });
        var extensionsToSave = null,
            saveExtensionsDialog = null;
        
        this._$table = $("<table class='table'/>").appendTo(this.$el);
        
        this.model.initialize().done(function () {
            self._setupEventHandlers();
            TeamExtensions.on("change", function () {
                self.model._initializeFromSource();
                self.model.filter("", true);
                self._render();
            });
        }).always(function () {
            self._render();
            result.resolve();
        });
        
        return result.promise();
    };
    
    TeamExtensionManagerView.prototype._updateMessage = function () {
        return true;
    };
        
    exports.ExtensionManagerView = TeamExtensionManagerView;
});
