////////////////////////////////////////////////////////////////
// Player Controls

$(document).on("click", "#play-pause", function () {
    console.log("Clicked Play/Pause");
    var is_paused = $(this).hasClass("paused");

    if (is_paused) {
        if (is_player_ready && !player.playing()) {
            player.play();
        }
    } else {
        if (is_player_ready && player.playing()) {
            player.pause();
        }
    }
});

$(document).on("click", "#seek-fwd", function () {
    console.log("Clicked Seek Forward");
    if (is_player_ready && player.playing()) {
        player.pause();
        player.seek(player.seek() + 15);
        player.play();
    }
});

$(document).on("click", "#seek-back", function () {
    console.log("Clicked Seek Backward");
    if (is_player_ready && player.playing()) {
        player.pause();
        player.seek(player.seek() - 15);
        player.play();
    }
});

$(document).on("click", "#prev", function () {
    console.log("Clicked Previous");

});

$(document).on("click", "#next", function () {
    console.log("Clicked Next");

});