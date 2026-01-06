// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_room_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CreateRoomResponse _$CreateRoomResponseFromJson(Map<String, dynamic> json) =>
    CreateRoomResponse(
      meta: Meta.fromJson(json['meta'] as Map<String, dynamic>),
      data: RoomData.fromJson(json['data'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CreateRoomResponseToJson(CreateRoomResponse instance) =>
    <String, dynamic>{'meta': instance.meta, 'data': instance.data};

Meta _$MetaFromJson(Map<String, dynamic> json) => Meta(
  code: (json['code'] as num).toInt(),
  message: json['message'] as String,
);

Map<String, dynamic> _$MetaToJson(Meta instance) => <String, dynamic>{
  'code': instance.code,
  'message': instance.message,
};

RoomData _$RoomDataFromJson(Map<String, dynamic> json) => RoomData(
  room: Room.fromJson(json['room'] as Map<String, dynamic>),
  nextStep: NextStep.fromJson(json['next_step'] as Map<String, dynamic>),
);

Map<String, dynamic> _$RoomDataToJson(RoomData instance) => <String, dynamic>{
  'room': instance.room,
  'next_step': instance.nextStep,
};

Room _$RoomFromJson(Map<String, dynamic> json) =>
    Room(code: json['code'] as String);

Map<String, dynamic> _$RoomToJson(Room instance) => <String, dynamic>{
  'code': instance.code,
};

NextStep _$NextStepFromJson(Map<String, dynamic> json) => NextStep(
  action: json['action'] as String,
  description: json['description'] as String,
  websocket: json['websocket'] as String,
);

Map<String, dynamic> _$NextStepToJson(NextStep instance) => <String, dynamic>{
  'action': instance.action,
  'description': instance.description,
  'websocket': instance.websocket,
};
