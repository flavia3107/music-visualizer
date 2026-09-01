export const PLAYER_CONTROLS_CONFIG = [
	{
		id: "shuffle",
		action: "shuffle",
		label: "Shuffle",
		icon: "shuffle",
		type: "toggle",
		activeClass: "active",
		className: "shuffle"
	},
	{
		id: "prev",
		action: "prev",
		label: "Previous track",
		icon: "fast_rewind",
		type: "action"
	},
	{
		id: "play-pause",
		action: "play-pause",
		label: "Play",
		// Allows toggling visual state dynamically (e.g. play_arrow <-> pause)
		icons: {
			playing: "pause",
			paused: "play_arrow"
		},
		labels: {
			playing: "Pause",
			paused: "Play"
		},
		type: "stateful"
	},
	{
		id: "next",
		action: "next",
		label: "Next track",
		icon: "fast_forward",
		type: "action"
	},
	{
		id: "repeat",
		action: "repeat",
		label: "Repeat",
		icon: "repeat",
		type: "toggle",
		activeClass: "active",
		className: "repeat"
	}
];