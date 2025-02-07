////////////////////////////////////////////////////////////////
// Player Controls

$(document).on("click", "#play-pause", function () {
    console.log("Clicked Play/Pause");
    var is_paused = $(this).hasClass("paused");

    if (is_paused) {
        // $(this).find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");

        if (is_player_ready && !player.playing()) {
            player.play();
        }

        // $(this).removeClass("paused");
    } else {
        // $(this).find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");

        if (is_player_ready && player.playing()) {
            player.pause();
        }

        // $(this).addClass("paused");
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