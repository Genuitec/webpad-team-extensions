// Licensed under the WebPad Commercial License
// Copyright 2015 Genuitec, LLC. All rights reserved.

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, Mustache, $ */

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        StatusBar = brackets.getModule("widgets/StatusBar"),
        ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
        ExtensionManagerDialog = brackets.getModule("extensibility/ExtensionManagerDialog");
    
    // Extension modules
    var TeamExtensions = require('TeamExtensions'),
        SaveExtensionsDialog = require("widgets/SaveExtensionsDialog");
    
    var MAIN_MENU_ID = "team-extensions-main",
        SAVE_EXTENSIONS_COMMAND_ID = "team-extensions-save-extensions";
    
    var WebPadMenu = Menus.addMenu("Team", MAIN_MENU_ID);
    var $missingExtensionsIndicator = $("<a href='#team-install-extensions'></a>").css({ color: "orangered" });
    
    $missingExtensionsIndicator.on("click", function () {
        CommandManager.execute("file.extensionManager");
    });
    
    CommandManager.register("Manage Extensions...", SAVE_EXTENSIONS_COMMAND_ID, function () {
        ExtensionManager.downloadRegistry().then(function () {
            TeamExtensions.manageExtensions();
        }).done();
    });
    
    WebPadMenu.addMenuItem(SAVE_EXTENSIONS_COMMAND_ID);
    
    var observer = null,
        tabObserver = null;
    
    function updateStatusBar(forceTeamExtensionsRefresh) {
        TeamExtensions.checkForMissingExtensions(ExtensionManager, forceTeamExtensionsRefresh)
            .then(function (missingExtensions) {
                if (missingExtensions.length > 0) {
                    var plural = "";
                    if (missingExtensions.length > 1) {
                        plural = "s";
                    }
                    
                    $missingExtensionsIndicator.html(
                        "Install " +
                        "<strong style='color: orangered;'>" + missingExtensions.length + "</strong>" +
                        " team extension" + plural
                    ).css;
                    StatusBar.updateIndicator("team-extensions", true);
                } else {
                    StatusBar.updateIndicator("team-extensions", false);
                }

            }).done();
    };
    
    AppInit.appReady(function () {
        var teamExtensionsIcon = ExtensionUtils.getModulePath(module, "images/extension-manager-team.svg");
        var target = document.querySelector('body');

        var observer = new window.MutationObserver(function (mutations) {
            var ExtensionManagerViewModel   = require("TeamExtensionsViewModel"),
                ExtensionManagerView        = require("ExtensionManagerView").ExtensionManagerView;
            
            mutations.forEach(function (mutation) {
                if ($('.extension-manager-dialog').length === 1 &&
                    $('.extension-manager-dialog ul.nav a[href="#team"]').length === 0
                   ) {
                    var installedTabSelector = document.querySelector('.tab-content');

                    // create an observer instance
                    tabObserver = new window.MutationObserver(function (mutations) {
                        var i = 0;
                        for (i = 0; i < mutations.length; i++) {
                            var mut = mutations[i];
                            if (mut.addedNodes.length > 0) {
                                var j = 0,
                                    nodeFound = false;

                                for (j = 0; j < mut.addedNodes.length; j++) {
                                    var node = mut.addedNodes[j];
                                    if (node.id === "installed" && $("team").length === 0) {
                                        nodeFound = true;                                    
                                        break;
                                    }                                    
                                };
                                
                                if (nodeFound &&
                                    $('.extension-manager-dialog ul.nav').find('a.team').length === 0
                                   ) {
                                    $('.extension-manager-dialog ul.nav').append('<li><a href="#team" class="team" data-toggle="tab"><img src="' + teamExtensionsIcon + '"/><br/>Team</a></li>');

                                    var model = new ExtensionManagerViewModel.TeamExtensionsViewModel(),
                                        view    = new ExtensionManagerView(),
                                        promise = view.initialize(model);

                                    view.$el.appendTo($(".extension-manager-dialog .modal-body"));

                                    $('.extension-manager-dialog').on("input", ".search", function (e) {
                                        var query = $(this).val();
                                        view.filter(query);
                                    });
                                    break;
                                }
                            }
                        }
                    });

                    tabObserver.observe(installedTabSelector, {
                        childList: true,
                        characterData: true
                    });
                }
            });
        });

        var config = { childList: true, characterData: true };

        observer.observe(target, config);
        
        StatusBar.addIndicator("team-extensions", $missingExtensionsIndicator, false);
        updateStatusBar();
        TeamExtensions.on("change", function () {
            updateStatusBar();
        });
        ExtensionManager.on("statusChange", function () {
            updateStatusBar();
        });
    });
    
    ProjectManager.on("projectOpen", function () {
        updateStatusBar(true);
    });

    ProjectManager.on("projectClose", function () {
        StatusBar.updateIndicator("team-extensions", false);
    });
    
});