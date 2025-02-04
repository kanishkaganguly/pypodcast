////////////////////////////////////////////////////////////////
// Volume Slider

$(document).on("input change", "#volume-slider", function () {
    $("#volume-value").text($(this).val());
    $("#volume-display").attr("value", $(this).val());
});

$(document).on("mouseup", "#volume-slider", function (e) {
    e.preventDefault();

    console.log("Volume: " + $(this).val() / 100.0);
    player.volume($(this).val() / 100.0);
});
