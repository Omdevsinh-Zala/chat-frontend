export interface CreateChannel {
    title: string,
    topic: string,
    description: string,
    isPrivate: boolean,
}

export interface ChannelMember {
    ban_until: Date | null,
    channel_id: string,
    created_at: Date,
    custom_data: string | null,
    deletedAt: Date | null,
    id: string,
    invite_by: string | null,
    is_active: boolean,
    is_muted: boolean,
    joined_at: Date,
    left_at: Date | null,
    mute_until: Date | null,
    role: string,
    updatedAt: Date,
    user_id: string,
    version: number,
}

export interface Channel {
    avatar_url: string,
    created_at: Date,
    is_private: boolean,
    last_message_at: Date | null,
    slug: string,
    title: string,
}