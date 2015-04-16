// Licensed under the WebPad Commercial License
// Copyright 2015 Genuitec, LLC. All rights reserved.

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";
 
    var ExtensionManagerViewModel = brackets.getModule("extensibility/ExtensionManagerViewModel"),
        ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
        _ = brackets.getModule("thirdparty/lodash");
    
    var TeamExtensions = require("TeamExtensions");
 
    function TeamExtensionsViewModel() {
        ExtensionManagerViewModel.InstalledViewModel.call(this);
        
        var self = this;
        ExtensionManager.on("registryDownload." + this.source, function () {
            self._sortFullSet();
            self._setInitialFilter();
        });
    }
    
    TeamExtensionsViewModel.prototype = Object.create(ExtensionManagerViewModel.InstalledViewModel.prototype);
    TeamExtensionsViewModel.prototype.constructor = TeamExtensionsViewModel;
 
    TeamExtensionsViewModel.prototype.source = 'team';
    
    exports.TeamExtensionsViewModel = TeamExtensionsViewModel;
    
    TeamExtensionsViewModel.prototype._initializeFromSource = function () {
        var self = this;
        
        return TeamExtensions.getExtensionsId().then(function (teamExtensionsId) {
            self.extensions = ExtensionManager.extensions;
            
            self.sortedFullSet = Object.keys(self.extensions)
                .filter(function (key) {
                    return self.extensions[key].registryInfo &&
                        _.contains(teamExtensionsId, key);
                });
            self._sortFullSet();
            self._setInitialFilter();
            self._countUpdates();
        });
    };
    
    TeamExtensionsViewModel.prototype._countUpdates = function () {
    };
 
    
    TeamExtensionsViewModel.prototype._sortFullSet = function () {
        var self = this;

        this.sortedFullSet = this.sortedFullSet.sort(function (key1, key2) {
            var metadata1 = self.extensions[key1].registryInfo.metadata,
                metadata2 = self.extensions[key2].registryInfo.metadata,
                id1 = (metadata1.title || metadata1.name).toLocaleLowerCase(),
                id2 = (metadata2.title || metadata2.name).toLocaleLowerCase();

            
            return id1.localeCompare(id2);
        });
    };
    
    TeamExtensionsViewModel.prototype._getEntry = function (id) {
        var entry = this.extensions[id];

        if (entry) {
            return entry.registryInfo;
        }
        return entry;
    };

    // TODO: Refactor and optimize the following function
    TeamExtensionsViewModel.prototype._handleStatusChange = function (e, id) {
        var index = this.sortedFullSet.indexOf(id),
            refilter = false;
        if (index !== -1 && !this.extensions[id].installInfo) {
            // This was in our set, but was uninstalled. Remove it.
            this.sortedFullSet.splice(index, 1);
            this._countUpdates();  // may also affect update count
            refilter = true;
        } else if (index === -1 && this.extensions[id].installInfo) {
            this._sortFullSet();
            refilter = true;
        }
        this._sortFullSet();

        refilter = true;
        if (refilter) {
            this.filter(this._lastQuery || "", true);
        }
        
        this.trigger("change", id);
    };
});
