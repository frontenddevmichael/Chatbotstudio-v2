<?php

namespace ChatBotStudio;

class Client
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct(string $apiKey, string $baseUrl = 'https://[project].supabase.co/functions/v1/rest-api')
    {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    private function request(string $method, string $path, ?array $body = null): array
    {
        $url = $this->baseUrl . $path;
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($response === false) {
            return ['error' => 'curl_error'];
        }
        $data = json_decode($response, true);
        return $data ?? ['error' => 'invalid_response', 'status' => $httpCode];
    }

    public function listChatbots(): array
    {
        return $this->request('GET', '/chatbots')['data'] ?? [];
    }

    public function getChatbot(string $chatbotId): ?array
    {
        return $this->request('GET', "/chatbots/{$chatbotId}")['data'] ?? null;
    }

    public function sendMessage(string $chatbotId, string $message, ?string $sessionId = null, array $extra = []): array
    {
        return $this->request('POST', "/chatbots/{$chatbotId}/chat", array_merge([
            'message' => $message,
            'session_id' => $sessionId ?? bin2hex(random_bytes(16)),
        ], $extra));
    }

    public function listFaqs(string $chatbotId): array
    {
        return $this->request('GET', "/chatbots/{$chatbotId}/faqs")['data'] ?? [];
    }

    public function createFaq(string $chatbotId, string $question, string $answer, array $variations = []): ?array
    {
        return $this->request('POST', "/chatbots/{$chatbotId}/faqs", [
            'question' => $question,
            'answer' => $answer,
            'variations' => $variations,
        ])['data'] ?? null;
    }

    public function listConversations(string $chatbotId): array
    {
        return $this->request('GET', "/chatbots/{$chatbotId}/conversations")['data'] ?? [];
    }

    public function getAnalytics(string $chatbotId): array
    {
        return $this->request('GET', "/chatbots/{$chatbotId}/analytics")['data'] ?? [];
    }
}
