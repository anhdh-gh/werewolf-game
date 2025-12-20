// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'role_config.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RoleConfig _$RoleConfigFromJson(Map<String, dynamic> json) => RoleConfig(
  wolf: (json['wolf'] as num?)?.toInt() ?? 3,
  guardian: (json['guardian'] as num?)?.toInt() ?? 1,
  witch: (json['witch'] as num?)?.toInt() ?? 1,
  prophet: (json['prophet'] as num?)?.toInt() ?? 1,
  villager: (json['villager'] as num?)?.toInt() ?? 1,
  cursed: (json['cursed'] as num?)?.toInt() ?? 1,
  mute: (json['mute'] as num?)?.toInt() ?? 1,
  desperate: (json['desperate'] as num?)?.toInt() ?? 1,
);

Map<String, dynamic> _$RoleConfigToJson(RoleConfig instance) =>
    <String, dynamic>{
      'wolf': instance.wolf,
      'guardian': instance.guardian,
      'witch': instance.witch,
      'prophet': instance.prophet,
      'villager': instance.villager,
      'cursed': instance.cursed,
      'mute': instance.mute,
      'desperate': instance.desperate,
    };
