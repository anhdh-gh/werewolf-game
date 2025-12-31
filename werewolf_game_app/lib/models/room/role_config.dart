import 'package:json_annotation/json_annotation.dart';

part 'role_config.g.dart';

@JsonSerializable()
class RoleConfig {
  final int wolf;
  final int guardian;
  final int witch;
  final int prophet;
  final int villager;
  final int cursed;
  final int mute;
  final int desperate;

  RoleConfig({
    this.wolf = 3,
    this.guardian = 1,
    this.witch = 1,
    this.prophet = 1,
    this.villager = 1,
    this.cursed = 1,
    this.mute = 1,
    this.desperate = 1,
  });

  factory RoleConfig.fromJson(Map<String, dynamic> json) =>
      _$RoleConfigFromJson(json);

  Map<String, dynamic> toJson() => _$RoleConfigToJson(this);

  int get totalRoles =>
      wolf + guardian + witch + prophet + villager + cursed + mute + desperate;
}

