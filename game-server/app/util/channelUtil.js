var ChannelUtil = module.exports;

var GLOBAL_CHANNEL_NAME = 'pomelo';
var CLUB_CHANNEL_PREFIX = 'club_';
var TABLE_CHANNEL_PREFIX = 'table_';

ChannelUtil.getGlobalChannelName = function() {
    return GLOBAL_CHANNEL_NAME;
};

ChannelUtil.getClubChannelName = function(clubId) {
    return CLUB_CHANNEL_PREFIX + clubId;
};

ChannelUtil.getTableChannelName = function(tableId) {
    return TABLE_CHANNEL_PREFIX + tableId;
};