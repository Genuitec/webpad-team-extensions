// Licensed under the WebPad Commercial License
// Copyright 2015 Genuitec, LLC. All rights reserved.
// See: https://github.com/Genuitec/webpad-team-extensions/blob/master/LICENSE.md

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, Mustache, $ */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var _  = brackets.getModule("thirdparty/lodash"),
        EventDispatcher     = brackets.getModule("utils/EventDispatcher"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils");
    
    var MANIFEST_FILENAME = ".team.extensions",
        SaveExtensionsDialog = require("widgets/SaveExtensionsDialog"),
        extensions = [];
    
    EventDispatcher.makeEventDispatcher(exports);
    
    function getEnabledExtensions(extensionManager) {
        var enabledExtensions = [];

        _.each(extensionManager.extensions, function (value, key) {
            if (
                typeof value.installInfo !== 'undefined' &&
                    typeof value.registryInfo !== 'undefined' &&
                    value.installInfo.status === "enabled" &&
                    value.registryInfo.metadata.theme === undefined
            ) {
                enabledExtensions.push({
                    id: value.installInfo.metadata.name,
                    version: value.installInfo.metadata.version
                });
            }
        });

        return enabledExtensions;
    }
    
    function checkForMissingExtensions(extensionManager, forceTeamExtensionsCacheRefresh) {
        var baseURL = ProjectManager.getProjectRoot().fullPath;
        var file = baseURL + '.team.extensions';
        var requiredExtensions = [];
        if (forceTeamExtensionsCacheRefresh) {
            extensions = [];
        }
        
        return FileUtils.readAsText(FileSystem.getFileForPath(file)).then(
            function (text) {
                requiredExtensions = JSON.parse(text);
                return;
            }
        ).then(extensionManager.downloadRegistry).then(
            function () {
                var missingExtensions = [];
                _.each(extensionManager.extensions, function (value, key) {
                    requiredExtensions.forEach(function (requiredExtension) {
                        if (key === requiredExtension.id && typeof value.installInfo === 'undefined') {
                            missingExtensions.push(requiredExtension);
                        }
                    });
                });

                return missingExtensions;
            }
        );
    }
    
    function getManifestFile(projectManager) {
        var baseURL = projectManager.getProjectRoot().fullPath;

        return FileSystem.getFileForPath(baseURL + MANIFEST_FILENAME);
    }
    
    function getExtensionsId() {
        var baseURL = ProjectManager.getProjectRoot().fullPath;
        var file = baseURL + '.team.extensions';
        var requiredExtensions = [];
        var deferred = new $.Deferred();
        
        FileUtils.readAsText(FileSystem.getFileForPath(file)).then(
            function (text) {
                var extensionIds =  JSON.parse(text).map(function (object) {
                    return object.id;
                });
                deferred.resolve(extensionIds);
            }
        ).fail(function () {
            deferred.resolve([]);
        });
        
        return deferred.promise();
    }
    
    function markAsTeam(extensionId) {
        extensions[extensionId].isTeamExtension = true;
        exports.trigger("markedAsTeam");
        exports.trigger("change");
    }
    
    function unmarkAsTeam(extensionId) {
        extensions[extensionId].isTeamExtension = false;
        exports.trigger("unmarkedAsTeam");
        exports.trigger("change");
    }
    
    function markAllAsTeam(extensionIds) {
        extensionIds.forEach(function (extensionId) {
            extensions[extensionId].isTeamExtension = true;
        });
        
        exports.trigger("markedAsTeam");
        exports.trigger("change");
    }
    
    function unmarkAllAsTeam(extensionIds) {
        extensionIds.forEach(function (extensionId) {
            extensions[extensionId].isTeamExtension = false;
        });
        
        exports.trigger("unmarkedAsTeam");
        exports.trigger("change");
    }

    function getMarkedAsTeam() {
        return _.values(extensions).filter(function (extension) {
            return extension.isTeamExtension;
        });
    }
    
    function update() {
        var teamExtensionIds = [];
        
        // Resetting extensions
        extensions = [];

        return getExtensionsId().then(function (extensionsId) {
            teamExtensionIds = extensionsId;
        }).then(function () {
            var enabledExtensions = getEnabledExtensions(ExtensionManager);
            
            enabledExtensions.forEach(function (extension) {
                var extensionInstallInfo = ExtensionManager.extensions[extension.id].installInfo;
                extensionInstallInfo.isTeamExtension = teamExtensionIds.indexOf(extension.id) > -1;

                extensions[extension.id] = extensionInstallInfo;
            });
        
        }).then(function () {
            teamExtensionIds.forEach(function (teamExtensionId) {
                if (!extensions[teamExtensionId]) {
                    var extensionRegistryInfo = ExtensionManager.extensions[teamExtensionId].registryInfo;
                    extensionRegistryInfo.isTeamExtension = true;
                
                    extensions[teamExtensionId] = extensionRegistryInfo;
                }
            });
        }).then(function () {
            extensions = extensions.sort(function (key1, key2) {
                var metadata1 = extensions[key1].registryInfo.metadata,
                    metadata2 = extensions[key2].registryInfo.metadata,
                    id1 = (metadata1.title || metadata1.name).toLocaleLowerCase(),
                    id2 = (metadata2.title || metadata2.name).toLocaleLowerCase();

                return id1.localeCompare(id2);
            });
        });
    }
    
    function getAll() {
        return _.values(extensions).sort(function (key1, key2) {
            var metadata1 = key1.metadata,
                metadata2 = key2.metadata;
                        
            var id1 = (metadata1.title || metadata1.name).toLocaleLowerCase();
            var id2 = (metadata2.title || metadata2.name).toLocaleLowerCase();

            return id1.localeCompare(id2);
        });
    }
    
    function manageExtensions() {
        var extensionsToSave = null,
            saveExtensionsDialog = null;

        saveExtensionsDialog = SaveExtensionsDialog.show(getEnabledExtensions(ExtensionManager));
        saveExtensionsDialog.getPromise().then(function (buttonId) {
            return getMarkedAsTeam();
        }).then(
            function (extensions) {
                extensionsToSave = extensions;
                return getManifestFile(ProjectManager);
            }
        ).then(
            function (manifestFile) {
                extensionsToSave = extensionsToSave.map(function (extension) {
                    return {id: extension.metadata.name};
                });
                
                if (extensionsToSave.length > 0) {
                    var fileContents = JSON.stringify(extensionsToSave, null, 4);
                    return FileUtils.writeText(manifestFile, fileContents, true);
                } else {
                        manifestFile.exists( function (error, exists) {
                            if (exists) {
                                manifestFile.unlink();
                            }
                        });
                }
            }
        ).then(function () {
            exports.trigger("change");
        }).done();
    }
    
    module.exports.getEnabledExtensions = getEnabledExtensions;
    module.exports.checkForMissingExtensions = checkForMissingExtensions;
    module.exports.getManifestFile = getManifestFile;
    module.exports.getExtensionsId = getExtensionsId;
    module.exports.markAsTeam = markAsTeam;
    module.exports.unmarkAsTeam = unmarkAsTeam;
    module.exports.extensions = extensions;
    module.exports.update = update;
    module.exports.getAll = getAll;
    module.exports.getMarkedAsTeam = getMarkedAsTeam;
    module.exports.manageExtensions = manageExtensions;
    module.exports.markAllAsTeam = markAllAsTeam;
    module.exports.unmarkAllAsTeam = unmarkAllAsTeam;
});