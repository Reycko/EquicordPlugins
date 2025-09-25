/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { findByPropsLazy, findStoreLazy } from "@webpack";
import { ChannelStore, GenericStore, GuildStore, UserStore } from "@webpack/common";

import { targets } from ".";

const { selectVoiceChannel } = findByPropsLazy("selectVoiceChannel", "selectChannel");

let lastVoiceState: { [userid: string]: MainVoiceStateData; } = {};

type MainVoiceStateData = {
    channelId: string;
    userId: string;
};

const VoiceStateStore: GenericStore = findStoreLazy("VoiceStateStore");

export const init = () => {
    voiceStateChange(); // init it cause you might wanna join asap
    VoiceStateStore.addChangeListener(voiceStateChange);
};

export const deinit = () => {
    VoiceStateStore.removeChangeListener(voiceStateChange);
};

const getChannelName = (channelId: string): string => {
    const channelData = ChannelStore.getChannel(channelId);

    if (channelData.isGuildVoice() || channelData.isGuildStageVoice()) {
        const guildData = GuildStore.getGuild(channelData.guild_id);
        return `${channelData.name} from ${guildData.name}`;
    } else {
        return channelData.name;
    }

    return "";
};

export const voiceStateChange = () => {
    const newVoiceState = {};
    for (const id of targets) {
        newVoiceState[id] = VoiceStateStore.getVoiceStateForUser(id);
        const voiceState: MainVoiceStateData = newVoiceState[id];

        if (voiceState && !lastVoiceState[id]) {
            const user = UserStore.getUser(id);
            const color = `#${user.accentColor?.toString(16)}`;

            showNotification({
                body: `${user.username} is in VC: ${getChannelName(voiceState.channelId)}\nClick to join them.`,
                title: "Stalker",
                icon: user.getAvatarURL(),
                color,
                onClick: () => {
                    selectVoiceChannel(voiceState.channelId);
                },
            });
        }
    }

    lastVoiceState = newVoiceState;
};
