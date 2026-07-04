<?php

namespace ChatBotStudio;

class Widget
{
    private string $embedToken;
    private string $baseUrl;
    private ?string $theme;
    private ?string $primaryColor;
    private string $position;
    private bool $exitIntent;
    private int $scrollTrigger;
    private int $autoOpenDelay;
    private ?string $language;
    private bool $voiceEnabled;

    public function __construct(
        string $embedToken,
        string $baseUrl = 'https://[project].supabase.co',
        ?string $theme = null,
        ?string $primaryColor = null,
        string $position = 'bottom-right',
        bool $exitIntent = false,
        int $scrollTrigger = 0,
        int $autoOpenDelay = 0,
        ?string $language = null,
        bool $voiceEnabled = true,
    ) {
        $this->embedToken = $embedToken;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->theme = $theme;
        $this->primaryColor = $primaryColor;
        $this->position = $position;
        $this->exitIntent = $exitIntent;
        $this->scrollTrigger = $scrollTrigger;
        $this->autoOpenDelay = $autoOpenDelay;
        $this->language = $language;
        $this->voiceEnabled = $voiceEnabled;
    }

    public function render(): string
    {
        $attrs = [
            'data-chatbot-token' => $this->embedToken,
            'data-position' => $this->position,
            'data-voice-enabled' => $this->voiceEnabled ? 'true' : 'false',
        ];
        if ($this->theme !== null) $attrs['data-theme'] = $this->theme;
        if ($this->primaryColor !== null) $attrs['data-primary-color'] = $this->primaryColor;
        if ($this->scrollTrigger > 0) $attrs['data-scroll-trigger'] = (string)$this->scrollTrigger;
        if ($this->autoOpenDelay > 0) $attrs['data-auto-open'] = (string)($this->autoOpenDelay * 1000);
        if ($this->language !== null) $attrs['data-language'] = $this->language;

        $attrStr = '';
        foreach ($attrs as $k => $v) {
            $attrStr .= ' ' . $k . '="' . htmlspecialchars($v, ENT_QUOTES) . '"';
        }
        $scriptSrc = $this->baseUrl . '/embed.js';

        return "<div id=\"cbs-widget\"{$attrStr}></div>\n<script src=\"{$scriptSrc}\" defer></script>";
    }

    public function renderHtml(): string
    {
        return "<!DOCTYPE html>\n<html><head><meta charset='utf-8'></head><body>\n" . $this->render() . "\n</body></html>";
    }
}
