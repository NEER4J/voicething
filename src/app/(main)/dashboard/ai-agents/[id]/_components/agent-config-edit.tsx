"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_TYPES, LANGUAGES, TONES, VOICE_OPTIONS, type Agent, type BusinessType, type Language, type Tone } from "@/types/agents";

interface AgentConfigEditProps {
  editedData: Partial<Agent>;
  setEditedData: (data: Partial<Agent>) => void;
}

export function AgentConfigEdit({ editedData, setEditedData }: AgentConfigEditProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={editedData.name ?? ""}
          onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_type">Business Type</Label>
        <Select
          value={editedData.business_type}
          onValueChange={(value) => setEditedData({ ...editedData, business_type: value as BusinessType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select
          value={editedData.language}
          onValueChange={(value) => setEditedData({ ...editedData, language: value as Language })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice">Voice</Label>
        <Select
          value={editedData.voice_id}
          onValueChange={(value) => {
            const voice = VOICE_OPTIONS.find((v) => v.id === value);
            setEditedData({ ...editedData, voice_id: value, voice_name: voice?.name });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICE_OPTIONS.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name} ({voice.gender})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <Select
          value={editedData.tone}
          onValueChange={(value) => setEditedData({ ...editedData, tone: value as Tone })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TONES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="greeting">Greeting Message</Label>
        <Textarea
          id="greeting"
          value={editedData.greeting_message ?? ""}
          onChange={(e) => setEditedData({ ...editedData, greeting_message: e.target.value })}
          className="min-h-[100px]"
        />
      </div>
    </>
  );
}
