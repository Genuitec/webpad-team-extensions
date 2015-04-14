/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets */

define(function (require, exports, module) {
    "use strict";

    var SAVE_EXTENSIONS_DIALOG_ID = "save-extensions-dialog",
        SAVE_EXTENSIONS_DIALOG_TITLE = "Save Extensions",
        SAVE_BUTTON_ID = "save-extensions-save-button",
        SAVE_BUTTON_LABEL = "Save",
        DIALOG_CLASS = "save-extensions-dialog",
        dialog = null;
    
    var TeamExtensions = require("TeamExtensions"),
        ExtensionEntry = require("text!templates/save-extensions-extension-entry.html");
    
    function render() {
        var $dlg = dialog.getElement();
        $dlg.off("click", "button.remove");
        $dlg.off("click", "button.install");
        
        var extensions = TeamExtensions.getAll();
        $("tbody.extension-list").empty();
        
        extensions.forEach(function (extension) {
            $(Mustache.render(ExtensionEntry, {extension: extension}))
                .appendTo($("tbody.extension-list"));
        });
    }
    
    function bindEvents() {
        var $dlg = dialog.getElement();
        
        $dlg.one("click", "button.remove", function (event) {
            var $button = $(event.target);
            TeamExtensions.unmarkAsTeam($button.attr("data-extension-id"));
        });
        $dlg.one("click", "button.install", function (event) {
            var $button = $(event.target);
            TeamExtensions.markAsTeam($button.attr("data-extension-id"));
        });
    }
    
    function show(installedExtensions) {
        var SaveExtensionsBodyTemplate = require("text!templates/save-extensions-body-dialog.html"),
            ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
            FileSystem = brackets.getModule("filesystem/FileSystem"),
            FileUtils = brackets.getModule("file/FileUtils"),
            ProjectManager = brackets.getModule("project/ProjectManager"),
            Dialogs = brackets.getModule("widgets/Dialogs");
        
        var extensions = TeamExtensions.getAll();
        dialog = Dialogs.showModalDialogUsingTemplate(
            Mustache.render(SaveExtensionsBodyTemplate)
        );
        
        var $trackAll = $("<a href='#team-track-alll'>Track All</a>")
            .click(function () {
                var extensionIds = [];
                dialog.getElement()
                    .find("button.install")
                    .each(function () {
                        extensionIds.push($(this).attr("data-extension-id"));
                    });
                if (extensionIds.length > 0) {
                    TeamExtensions.markAllAsTeam(extensionIds);
                }
            });
        dialog.getElement().find("div.right-column").append($trackAll);
        
        var $untrackAll = $("<a href='#team-untrack-alll'>Untrack All</a>")
            .css({ marginLeft: "20px" })
            .click(function () {
                var extensionIds = [];
                dialog.getElement()
                    .find("button.remove")
                    .each(function () {
                        extensionIds.push($(this).attr("data-extension-id"));
                    });
                if (extensionIds.length > 0) {
                    TeamExtensions.unmarkAllAsTeam(extensionIds);
                }
            });
        dialog.getElement().find("div.right-column").append($untrackAll);
        
        TeamExtensions.update().then(function () {
            render();
            bindEvents();
            
            TeamExtensions.on("change", function () {
                render();
                bindEvents();
            });
        });
        
        return dialog;
    }

    module.exports.show = show;
});